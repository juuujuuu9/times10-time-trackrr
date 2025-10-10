import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { projectTeams, teams, projects } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../utils/session';

// DELETE /api/projects/[id]/teams/[teamId] - Remove a team from a project
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

    const projectId = parseInt(params.id!);
    const teamId = parseInt(params.teamId!);
    
    if (!projectId || isNaN(projectId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid project ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if assignment exists
    const existingAssignment = await db.query.projectTeams.findFirst({
      where: and(
        eq(projectTeams.projectId, projectId),
        eq(projectTeams.teamId, teamId)
      )
    });

    if (!existingAssignment) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team is not assigned to this project'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get project and team names for response
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    // Remove the assignment
    await db.delete(projectTeams).where(
      and(
        eq(projectTeams.projectId, projectId),
        eq(projectTeams.teamId, teamId)
      )
    );

    return new Response(JSON.stringify({
      success: true,
      message: `Team "${team?.name || 'Unknown'}" removed from project "${project?.name || 'Unknown'}"`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error removing team from project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to remove team from project'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
