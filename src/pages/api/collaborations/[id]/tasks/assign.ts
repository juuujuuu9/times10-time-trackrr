import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { taskAssignments, users, tasks, teams, teamMembers } from '../../../../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { sendTaskAssignmentEmail } from '../../../../../utils/email';
import { getTaskWithProject, getUsersByIds, getUserById } from '../../../../../db/queries';
import { getSessionUser } from '../../../../../utils/session';
import { getEmailBaseUrl } from '../../../../../utils/url';

export const POST: APIRoute = async (context) => {
  try {
    console.log('POST /api/collaborations/[id]/tasks/assign - Starting request');

    // Get the authenticated user
    console.log('POST /api/collaborations/[id]/tasks/assign - About to check authentication');
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Authentication failed - no user returned');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/collaborations/[id]/tasks/assign - Authentication successful - user:', currentUser.id);

    const body = await context.request.json();
    const { taskId, userIds } = body;

    console.log('POST /api/collaborations/[id]/tasks/assign - Request body:', { taskId, userIds });

    if (!taskId || !userIds || !Array.isArray(userIds)) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Validation failed:', { taskId, userIds });
      return new Response(JSON.stringify({ error: 'Task ID and user IDs array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get task and project information for email notifications
    console.log('POST /api/collaborations/[id]/tasks/assign - Getting task info for ID:', taskId);
    const taskInfo = await getTaskWithProject(parseInt(taskId));
    if (!taskInfo) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Task not found');
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/collaborations/[id]/tasks/assign - Task found:', taskInfo.name);

    // Validate that the task exists in the database
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, parseInt(taskId)))
      .limit(1);
    
    if (taskExists.length === 0) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Task does not exist in database');
      return new Response(JSON.stringify({ error: 'Task not found in database' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/collaborations/[id]/tasks/assign - Task exists in database');

    // RULE-001: Enforce hierarchical permissions - only team members can be assigned to tasks
    console.log('POST /api/collaborations/[id]/tasks/assign - Validating team member restrictions');
    
    // Get the task with team information
    const taskWithTeam = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(taskId)),
      with: {
        team: {
          with: {
            members: {
              with: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!taskWithTeam) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Task not found in database');
      return new Response(JSON.stringify({ error: 'Task not found in database' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get collaboration details to check membership
    const collaboration = await db.query.teams.findFirst({
      where: eq(teams.id, parseInt(context.params.id!))
    });

    if (!collaboration) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Collaboration not found');
      return new Response(JSON.stringify({ 
        error: 'Collaboration not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get team members directly
    const teamMembers = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, parseInt(context.params.id!)),
      with: {
        user: true
      }
    });

    console.log('POST /api/collaborations/[id]/tasks/assign - Team members:', teamMembers);

    // Check if current user is a member of the collaboration
    const isCurrentUserMember = teamMembers.some(
      (member: any) => member.userId === currentUser.id
    );
    
    if (!isCurrentUserMember) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Current user is not a member of the collaboration');
      return new Response(JSON.stringify({ 
        error: 'Access denied - you are not a member of this collaboration'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if task belongs to this collaboration either by:
    // 1. Direct teamId association, or
    // 2. Project association (if the collaboration's project matches the task's project)
    const isTaskInCollaboration = taskWithTeam.teamId === parseInt(context.params.id!) || 
      (collaboration.projectId && taskWithTeam.projectId === collaboration.projectId);

    if (!isTaskInCollaboration) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Task does not belong to this collaboration');
      return new Response(JSON.stringify({ 
        error: 'Task does not belong to this collaboration'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate that all users are team members
    const teamMemberIds = teamMembers.map(member => member.userId);
    console.log('POST /api/collaborations/[id]/tasks/assign - Team member IDs:', teamMemberIds);
    console.log('POST /api/collaborations/[id]/tasks/assign - Requested user IDs:', userIds);
    console.log('POST /api/collaborations/[id]/tasks/assign - Team members:', teamMembers);
    
    const invalidUserIds = userIds.filter(userId => !teamMemberIds.includes(userId));
    console.log('POST /api/collaborations/[id]/tasks/assign - Invalid user IDs:', invalidUserIds);
    
    if (invalidUserIds.length > 0) {
      console.log('POST /api/collaborations/[id]/tasks/assign - Invalid users not in team:', invalidUserIds);
      return new Response(JSON.stringify({ 
        error: 'Only team members can be assigned to tasks. Invalid user IDs: ' + invalidUserIds.join(', '),
        invalidUserIds: invalidUserIds,
        teamMemberIds: teamMemberIds,
        requestedUserIds: userIds
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/collaborations/[id]/tasks/assign - All users are valid team members');

    // Get current user information for the "assigned by" field
    const assignedByUser = await getUserById(currentUser.id);
    const assignedByName = assignedByUser?.name || 'Unknown User';

    // First, remove all existing assignments for this task
    console.log('POST /api/collaborations/[id]/tasks/assign - Removing existing assignments for task:', taskId);
    try {
      console.log('POST /api/collaborations/[id]/tasks/assign - About to delete existing assignments');
      const deleteResult = await db
        .delete(taskAssignments)
        .where(eq(taskAssignments.taskId, parseInt(taskId)));
      console.log('POST /api/collaborations/[id]/tasks/assign - Delete result:', deleteResult);
      console.log('POST /api/collaborations/[id]/tasks/assign - Existing assignments removed successfully');
    } catch (deleteError) {
      console.error('POST /api/collaborations/[id]/tasks/assign - Error removing existing assignments:', deleteError);
      console.error('POST /api/collaborations/[id]/tasks/assign - Delete error details:', {
        name: deleteError instanceof Error ? deleteError.name : 'Unknown',
        message: deleteError instanceof Error ? deleteError.message : 'Unknown error',
        stack: deleteError instanceof Error ? deleteError.stack : 'No stack trace'
      });
      throw new Error(`Failed to remove existing assignments: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
    }

    // Then, add new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map(userId => ({
        taskId: parseInt(taskId),
        userId: parseInt(userId),
      }));

      console.log('POST /api/collaborations/[id]/tasks/assign - Adding new assignments:', assignments);
      
      // Validate that all users exist
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, userIds.map(id => parseInt(id))));
      
      console.log('POST /api/collaborations/[id]/tasks/assign - Found existing users:', existingUsers.map(u => u.id));
      
      if (existingUsers.length !== userIds.length) {
        const foundUserIds = existingUsers.map(u => u.id);
        const missingUserIds = userIds.filter(id => !foundUserIds.includes(parseInt(id)));
        throw new Error(`Some users not found: ${missingUserIds.join(', ')}`);
      }
      
      try {
        console.log('POST /api/collaborations/[id]/tasks/assign - About to insert assignments:', assignments);
        const insertResult = await db.insert(taskAssignments).values(assignments);
        console.log('POST /api/collaborations/[id]/tasks/assign - Insert result:', insertResult);
        console.log('POST /api/collaborations/[id]/tasks/assign - Assignments added successfully');
      } catch (insertError) {
        console.error('POST /api/collaborations/[id]/tasks/assign - Error adding assignments:', insertError);
        console.error('POST /api/collaborations/[id]/tasks/assign - Insert error details:', {
          name: insertError instanceof Error ? insertError.name : 'Unknown',
          message: insertError instanceof Error ? insertError.message : 'Unknown error',
          stack: insertError instanceof Error ? insertError.stack : 'No stack trace'
        });
        throw new Error(`Failed to add assignments: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }

      // Send email notifications to newly assigned users
      try {
        const assignedUsers = await getUsersByIds(userIds.map(id => parseInt(id)));
        
        // Get the base URL for the dashboard link
        const baseUrl = getEmailBaseUrl();
        const dashboardUrl = `${baseUrl}/dashboard`;

        // Send emails to each assigned user
        for (const user of assignedUsers) {
          if (user.email && user.id !== currentUser.id) { // Don't send email to the person doing the assignment
            try {
              console.log(`📧 Attempting to send task assignment email to ${user.email}`);
              await sendTaskAssignmentEmail({
                email: user.email,
                userName: user.name,
                taskName: taskInfo.name,
                projectName: taskInfo.projectName,
                assignedBy: assignedByName,
                taskDescription: taskInfo.description || undefined,
                dashboardUrl: dashboardUrl,
              });
              console.log(`📧 Task assignment email sent to ${user.email}`);
            } catch (emailError) {
              console.error(`Failed to send task assignment email to ${user.email}:`, emailError);
              // Don't fail the entire operation if email fails
            }
          } else {
            console.log(`📧 Skipping email for user ${user.email} (same user or no email)`);
          }
        }
      } catch (notificationError) {
        console.error('Error sending task assignment notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Task assignments updated successfully',
      notificationsSent: userIds.length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/collaborations/[id]/tasks/assign - Error updating task assignments:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('POST /api/collaborations/[id]/tasks/assign - Error name:', error.name);
      console.error('POST /api/collaborations/[id]/tasks/assign - Error message:', error.message);
      console.error('POST /api/collaborations/[id]/tasks/assign - Error stack:', error.stack);
    }
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connection')) {
      return new Response(JSON.stringify({ 
        error: 'Database connection error', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid task or user ID', 
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to update task assignments', 
      details: error instanceof Error ? error.message : 'Unknown error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
