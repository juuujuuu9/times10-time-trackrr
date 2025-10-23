import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { teams, teamMembers as teamMembersTable, users, projects } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';
import { sendCollaborationAssignmentEmail, sendCollaborationRemovalEmail } from '../../../../utils/email';
import { getEmailBaseUrl } from '../../../../utils/url';

// POST /api/collaborations/[id]/members - Add user to collaboration
export const POST: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();
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

    // Check if collaboration exists and user is a member (for permission check)
    const existingCollaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId),
      with: {
        members: {
          with: {
            user: true
          }
        }
      }
    });

    if (!existingCollaboration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Collaboration not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if current user is a member of this collaboration
    const currentUserMembership = existingCollaboration.members.find(
      (member: any) => member.user.id === currentUser.id
    );
    
    if (!currentUserMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied - you are not a member of this collaboration'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is already a member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembersTable.teamId, collaborationId),
        eq(teamMembersTable.userId, userId)
      )
    });

    if (existingMember) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User is already a member of this collaboration'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add new team member
    await db.insert(teamMembersTable).values({
      teamId: collaborationId,
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
          where: eq(projects.id, existingCollaboration.projectId)
        });

        // Get base URL for dashboard link
        const baseUrl = getEmailBaseUrl();
        const dashboardUrl = `${baseUrl}/dashboard/collaborations/${collaborationId}`;

        console.log(`📧 Attempting to send collaboration assignment email to ${addedUser.email}`);
        await sendCollaborationAssignmentEmail({
          email: addedUser.email,
          userName: addedUser.name,
          collaborationName: existingCollaboration.name,
          projectName: project?.name || 'Unknown Project',
          addedBy: currentUser.name,
          collaborationDescription: existingCollaboration.description || undefined,
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
      message: 'User added to collaboration successfully',
      data: {
        collaborationId: collaborationId,
        userId: userId
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding user to collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add user to collaboration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/collaborations/[id]/members - Update team members (remove users)
export const PUT: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();
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

    // Check if collaboration exists and user is a member
    const existingCollaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId),
      with: {
        members: {
          with: {
            user: true
          }
        }
      }
    });

    if (!existingCollaboration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Collaboration not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if current user is a member of this collaboration
    const currentUserMembership = existingCollaboration.members.find(
      (member: any) => member.user.id === currentUser.id
    );
    
    if (!currentUserMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied - you are not a member of this collaboration'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate member IDs are numbers
    const validMemberIds = memberIds.filter(id => typeof id === 'number' && !isNaN(id));
    
    // Get current team members to identify who's being removed
    const currentMembers = await db.query.teamMembers.findMany({
      where: eq(teamMembersTable.teamId, collaborationId)
    });
    
    const currentMemberIds = currentMembers.map(member => member.userId);
    const removedMemberIds = currentMemberIds.filter(id => !validMemberIds.includes(id));
    
    // Send removal notifications before cascading removal
    if (removedMemberIds.length > 0) {
      try {
        // Get project details for email notifications
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, existingCollaboration.projectId)
        });

        if (project) {
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
                  collaborationName: existingCollaboration.name,
                  projectName: project.name,
                  removedBy: currentUser.name,
                  dashboardUrl: fallbackUrl,
                });
                console.log(`📧 Collaboration removal email sent to ${removedUser.email}`);
              } catch (emailError) {
                console.error(`Failed to send collaboration removal email to ${removedUser.email}:`, emailError);
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending collaboration removal notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
    }

    // Update team members (this will remove users not in the new list)
    // First, remove all existing members (except the creator/lead)
    await db.delete(teamMembersTable).where(
      and(
        eq(teamMembersTable.teamId, collaborationId),
        eq(teamMembersTable.role, 'member')
      )
    );

    // Add back the members that should remain
    if (validMemberIds.length > 0) {
      const teamMemberInserts = validMemberIds.map((userId: number) => ({
        teamId: collaborationId,
        userId: userId,
        role: 'member',
        joinedAt: new Date()
      }));
      
      await db.insert(teamMembersTable).values(teamMemberInserts);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Team members updated successfully',
      data: {
        collaborationId: collaborationId,
        updatedMemberIds: validMemberIds,
        removedMemberIds: removedMemberIds
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating team members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update team members'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};