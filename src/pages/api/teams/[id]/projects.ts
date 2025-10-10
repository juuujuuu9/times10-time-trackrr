import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { projectTeams, projects, clients, users } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/teams/[id]/projects - Get projects assigned to a team
export const GET: APIRoute = async ({ params }) => {
  try {
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

    // Get projects assigned to this team
    const assignedProjects = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        clientName: clients.name,
        clientId: clients.id,
        assignedAt: projectTeams.assignedAt,
        assignedBy: users.name,
        assignedByEmail: users.email
      })
      .from(projectTeams)
      .innerJoin(projects, eq(projectTeams.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .innerJoin(users, eq(projectTeams.assignedBy, users.id))
      .where(and(
        eq(projectTeams.teamId, teamId),
        eq(projects.archived, false),
        eq(clients.archived, false)
      ));

    return new Response(JSON.stringify({
      success: true,
      data: assignedProjects
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team projects:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team projects'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
