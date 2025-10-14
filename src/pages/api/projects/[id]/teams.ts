import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { teams, users, projects } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/projects/[id]/teams - Get teams assigned to a project
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id!);
    
    if (!projectId || isNaN(projectId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid project ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get teams assigned to this project
    const assignedTeams = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        teamDescription: teams.description,
        assignedAt: teams.createdAt,
        assignedBy: users.name,
        assignedByEmail: users.email
      })
      .from(teams)
      .innerJoin(users, eq(teams.createdBy, users.id))
      .where(eq(teams.projectId, projectId));

    return new Response(JSON.stringify({
      success: true,
      data: assignedTeams
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching project teams:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch project teams'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/projects/[id]/teams - Assign a team to a project
export const POST: APIRoute = async ({ params, request }) => {
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

    const projectId = parseInt(params.id!);
    
    if (!projectId || isNaN(projectId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid project ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { teamId } = body;

    if (!teamId || isNaN(parseInt(teamId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if project exists
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

    // Check if team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, parseInt(teamId))
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

    // Check if assignment already exists (using direct relationship)
    const existingTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.projectId, projectId),
        eq(teams.id, parseInt(teamId))
      )
    });

    if (existingTeam) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team is already assigned to this project'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the assignment (update team with project)
    const updatedTeam = await db.update(teams).set({
      projectId: projectId
    }).where(eq(teams.id, parseInt(teamId))).returning();

    return new Response(JSON.stringify({
      success: true,
      data: updatedTeam[0],
      message: `Team "${team.name}" assigned to project "${project.name}"`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error assigning team to project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to assign team to project'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
