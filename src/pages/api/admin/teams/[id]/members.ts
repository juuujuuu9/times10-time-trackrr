import { db } from '../../../../../db/index';
import { teams, teamMembers as teamMembersTable, taskAssignments, taskDiscussions, tasks, users, projects } from '../../../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSessionUser } from '../../../../../utils/session';
import { sendCollaborationAssignmentEmail, sendCollaborationRemovalEmail } from '../../../../../utils/email';
import { getEmailBaseUrl } from '../../../../../utils/url';

// RULE-001: Cascading removal function - removes user from all tasks and subtasks when removed from team
async function cascadeRemoveUserFromTeam(userId: number, teamId: number) {
  console.log(`Cascading removal: Removing user ${userId} from team ${teamId} and all related tasks/subtasks`);
  
  try {
    // 1. Get all task assignments for this user (regardless of team)
    const userTaskAssignments = await db.query.taskAssignments.findMany({
      where: eq(taskAssignments.userId, userId)
    });
    
    const taskIds = userTaskAssignments.map(assignment => assignment.taskId);
    console.log(`Found ${taskIds.length} task assignments for user ${userId} to process`);
    
    if (taskIds.length === 0) {
      console.log('No task assignments found for this user, skipping cascading removal');
      return { tasksRemoved: 0, subtasksUpdated: 0 };
    }
    
    // 2. Remove user from all task assignments
    const removedTaskAssignments = await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.userId, userId))
      .returning();
    
    console.log(`Removed ${removedTaskAssignments.length} task assignments`);
    
    // 3. Remove user from all subtasks in the user's tasks
    let subtasksUpdated = 0;
    
    // Get user name once for efficiency
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      console.log('User not found, skipping subtask removal');
      return { tasksRemoved: removedTaskAssignments.length, subtasksUpdated: 0 };
    }
    
    for (const taskId of taskIds) {
      // Get all subtask discussions for this task
      const subtaskDiscussions = await db.query.taskDiscussions.findMany({
        where: and(
          eq(taskDiscussions.taskId, taskId),
          eq(taskDiscussions.type, 'subtask')
        )
      });
      
      for (const discussion of subtaskDiscussions) {
        if (discussion.subtaskData) {
          try {
            const subtaskData = JSON.parse(discussion.subtaskData);
            if (subtaskData.subtasks && Array.isArray(subtaskData.subtasks)) {
              let updated = false;
              
              // Remove user from all subtasks in this discussion
              subtaskData.subtasks.forEach((subtask: any) => {
                if (subtask.assignees && Array.isArray(subtask.assignees)) {
                  if (subtask.assignees.includes(user.name)) {
                    subtask.assignees = subtask.assignees.filter((assignee: string) => assignee !== user.name);
                    updated = true;
                  }
                }
              });
              
              if (updated) {
                // Update the discussion with modified subtask data
                await db
                  .update(taskDiscussions)
                  .set({ 
                    subtaskData: JSON.stringify(subtaskData),
                    updatedAt: new Date()
                  })
                  .where(eq(taskDiscussions.id, discussion.id));
                
                subtasksUpdated++;
              }
            }
          } catch (parseError) {
            console.error('Error parsing subtask data for discussion:', discussion.id, parseError);
          }
        }
      }
    }
    
    console.log(`Updated ${subtasksUpdated} subtask discussions`);
    
    return { 
      tasksRemoved: removedTaskAssignments.length, 
      subtasksUpdated: subtasksUpdated 
    };
    
  } catch (error) {
    console.error('Error in cascading removal:', error);
    throw error;
  }
}

export async function POST(Astro: any) {
  try {
    // Check authentication
    const currentUser = await getSessionUser(Astro);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team ID from URL
    const teamId = parseInt(Astro.params.id);
    if (isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    if (!team) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await Astro.request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid userId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is already a member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembersTable.teamId, teamId),
        eq(teamMembersTable.userId, userId)
      )
    });

    if (existingMember) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User is already a member of this team'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add new team member
    await db.insert(teamMembersTable).values({
      teamId: teamId,
      userId: userId,
      role: 'member',
      joinedAt: new Date()
    });

    // Send email notification to the newly added user
    try {
      // Get user details for email
      const addedUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (addedUser && addedUser.email && addedUser.id !== currentUser.id) {
        // Get project details for the email
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, team.projectId)
        });

        // Get base URL for dashboard link
        const baseUrl = getEmailBaseUrl();
        const dashboardUrl = `${baseUrl}/admin/collaborations/${teamId}`;

        console.log(`📧 Attempting to send collaboration assignment email to ${addedUser.email}`);
        await sendCollaborationAssignmentEmail({
          email: addedUser.email,
          userName: addedUser.name,
          collaborationName: team.name,
          projectName: project?.name || 'Unknown Project',
          addedBy: currentUser.name,
          collaborationDescription: team.description || undefined,
          dashboardUrl: dashboardUrl,
        });
        console.log(`📧 Collaboration assignment email sent to ${addedUser.email}`);
      } else {
        console.log(`📧 Skipping email for user ${addedUser?.email} (same user or no email)`);
      }
    } catch (emailError) {
      console.error('Error sending collaboration assignment notification:', emailError);
      // Don't fail the entire operation if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Team member added successfully',
      data: {
        teamId: teamId,
        userId: userId
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(Astro: any) {
  try {
    // Check authentication
    const currentUser = await getSessionUser(Astro);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team ID from URL
    const teamId = parseInt(Astro.params.id);
    if (isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    if (!team) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await Astro.request.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'memberIds must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate member IDs are numbers
    const validMemberIds = memberIds.filter(id => typeof id === 'number' && !isNaN(id));
    
    // Get current team members to identify who's being removed
    const currentMembers = await db.query.teamMembers.findMany({
      where: eq(teamMembersTable.teamId, teamId)
    });
    
    const currentMemberIds = currentMembers.map(member => member.userId);
    const removedMemberIds = currentMemberIds.filter(id => !validMemberIds.includes(id));
    
    // Send removal notifications before cascading removal
    if (removedMemberIds.length > 0) {
      try {
        // Get team and project details for email notifications
        const teamDetails = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
          with: {
            project: true
          }
        });

        if (teamDetails) {
          const baseUrl = getEmailBaseUrl();
          const fallbackUrl = `${baseUrl}/dashboard`;

          // Send removal notifications to removed users
          for (const removedUserId of removedMemberIds) {
            const removedUser = await db.query.users.findFirst({
              where: eq(users.id, removedUserId)
            });

            if (removedUser && removedUser.email) {
              try {
                console.log(`📧 Attempting to send collaboration removal email to ${removedUser.email}`);
                await sendCollaborationRemovalEmail({
                  email: removedUser.email,
                  userName: removedUser.name,
                  collaborationName: teamDetails.name,
                  projectName: teamDetails.project?.name || 'Unknown Project',
                  removedBy: currentUser.name,
                  fallbackUrl: fallbackUrl,
                });
                console.log(`📧 Collaboration removal email sent to ${removedUser.email}`);
              } catch (emailError) {
                console.error(`Failed to send collaboration removal email to ${removedUser.email}:`, emailError);
                // Don't fail the entire operation if email fails
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending collaboration removal notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
    }
    
    // RULE-001: Cascading removal - remove users from all tasks and subtasks when removed from team
    for (const removedUserId of removedMemberIds) {
      try {
        const cascadeResult = await cascadeRemoveUserFromTeam(removedUserId, teamId);
        console.log(`Cascading removal completed for user ${removedUserId}:`, cascadeResult);
      } catch (cascadeError) {
        console.error(`Error in cascading removal for user ${removedUserId}:`, cascadeError);
        // Continue with team member removal even if cascading fails
      }
    }

    // Remove all existing team members
    await db.delete(teamMembersTable).where(eq(teamMembersTable.teamId, teamId));

    // Add new team members
    if (validMemberIds.length > 0) {
      const newMembers = validMemberIds.map(userId => ({
        teamId: teamId,
        userId: userId,
        role: 'member',
        joinedAt: new Date()
      }));

      await db.insert(teamMembersTable).values(newMembers);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Team members updated successfully',
      data: {
        teamId: teamId,
        memberCount: validMemberIds.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating team members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
