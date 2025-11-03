import type { APIRoute } from 'astro';
import { db } from '../../db';
import { teams, teamMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

// GET /api/teams - Get all teams for the current user
export const GET: APIRoute = async (context) => {
  try {
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

    // Get teams where user is a member
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        userRole: teamMembers.role,
        joinedAt: teamMembers.joinedAt
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
      .where(and(
        eq(teamMembers.userId, currentUser.id),
        eq(teams.archived, false)
      ));

    return new Response(JSON.stringify({
      success: true,
      data: userTeams
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch teams'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/teams - Create a new team
export const POST: APIRoute = async (context) => {
  try {
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

    // Check if user can create teams
    if (!['admin', 'developer', 'team_manager'].includes(currentUser.role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions to create teams'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json().catch(() => ({}));
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

    // Create the team
    const newTeam = await db.insert(teams).values({
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    }).returning();

    const teamId = newTeam[0].id;

    // Add the creator as a team lead
    await db.insert(teamMembers).values({
      teamId: teamId,
      userId: currentUser.id,
      role: 'lead',
      joinedAt: new Date()
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: teamId,
        name: newTeam[0].name,
        description: newTeam[0].description,
        createdBy: newTeam[0].createdBy,
        createdAt: newTeam[0].createdAt
      },
      message: 'Team created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create team'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
