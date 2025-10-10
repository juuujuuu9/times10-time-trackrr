import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers as teamMembersTable, projects } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// GET /api/collaborations/[id] - Get a specific collaboration
export const GET: APIRoute = async (context) => {
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

    // Get collaboration details
    const collaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId)
    });

    if (!collaboration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Collaboration not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: collaboration
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch collaboration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/collaborations/[id] - Update a collaboration
export const PUT: APIRoute = async (context) => {
  let projectId: number | undefined;
  let description: string | undefined;
  let teamMembers: number[] = [];
  
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

    const body = await context.request.json().catch(() => ({}));
    ({ projectId, description, teamMembers = [] } = body);

    // Validate required fields
    if (!projectId || typeof projectId !== 'number') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get project details to use as collaboration name
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if collaboration exists
    const existingCollaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId)
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

    // Update the collaboration
    const updatedCollaboration = await db
      .update(teams)
      .set({
        name: project.name,
        description: description?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(teams.id, collaborationId))
      .returning();

    // Update team members if provided
    if (teamMembers && teamMembers.length >= 0) {
      // Remove all existing team members (except the creator/lead)
      await db.delete(teamMembersTable).where(
        and(
          eq(teamMembersTable.teamId, collaborationId),
          eq(teamMembersTable.role, 'member')
        )
      );

      // Add new team members (exclude the creator to avoid duplicate)
      if (teamMembers.length > 0) {
        const filteredTeamMembers = teamMembers.filter(userId => userId !== currentUser.id);
        
        if (filteredTeamMembers.length > 0) {
          const teamMemberInserts = filteredTeamMembers.map((userId: number) => ({
            teamId: collaborationId,
            userId: userId,
            role: 'member',
            joinedAt: new Date()
          }));
          
          await db.insert(teamMembersTable).values(teamMemberInserts);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedCollaboration[0].id,
        name: updatedCollaboration[0].name,
        description: updatedCollaboration[0].description,
        createdBy: updatedCollaboration[0].createdBy,
        createdAt: updatedCollaboration[0].createdAt,
        updatedAt: updatedCollaboration[0].updatedAt
      },
      message: 'Collaboration updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update collaboration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/collaborations/[id] - Archive a collaboration
export const DELETE: APIRoute = async (context) => {
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

    // Check if collaboration exists
    const existingCollaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId)
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

    // Archive the collaboration (soft delete)
    await db
      .update(teams)
      .set({
        archived: true,
        updatedAt: new Date()
      })
      .where(eq(teams.id, collaborationId));

    return new Response(JSON.stringify({
      success: true,
      message: 'Collaboration archived successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error archiving collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to archive collaboration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
