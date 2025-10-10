import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// GET /api/teams/[id] - Get team details
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a member of the team
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team details
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

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        createdBy: team.createdBy,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        userRole: teamMembership.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/teams/[id] - Update team
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a team lead
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id),
        eq(teamMembers.role, 'lead')
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only team leads can update team details'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { name, description } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (name.trim().length > 255) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team name must be 255 characters or less'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the team
    const updatedTeam = await db
      .update(teams)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (updatedTeam.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedTeam[0].id,
        name: updatedTeam[0].name,
        description: updatedTeam[0].description,
        updatedAt: updatedTeam[0].updatedAt
      },
      message: 'Team updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating team:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update team'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/teams/[id] - Archive team (soft delete)
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a team lead
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id),
        eq(teamMembers.role, 'lead')
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only team leads can archive teams'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Archive the team (soft delete)
    const archivedTeam = await db
      .update(teams)
      .set({
        archived: true,
        updatedAt: new Date()
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (archivedTeam.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Team archived successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error archiving team:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to archive team'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
