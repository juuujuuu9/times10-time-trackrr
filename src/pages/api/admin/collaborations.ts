import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers as teamMembersTable, projects, projectTeams } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// POST /api/admin/collaborations - Create a new collaboration
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();
    const { name, description, projectId, members = [] } = body;
    
    console.log('Creating collaboration with data:', {
      name,
      description,
      projectId,
      members,
      currentUserId: currentUser.id
    });

    // Validate required fields
    if (!name || !description) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name and description are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify project exists if projectId is provided
    if (projectId) {
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
    }

    // Create the team
    const [newTeam] = await db.insert(teams).values({
      name,
      description,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    }).returning();

    // Add members to the team
    if (members.length > 0) {
      const memberInserts = members.map((memberId: number) => ({
        teamId: newTeam.id,
        userId: memberId,
        role: 'member',
        joinedAt: new Date()
      }));
      
      await db.insert(teamMembersTable).values(memberInserts);
    }

    // Link to project if provided
    if (projectId) {
      await db.insert(projectTeams).values({
        projectId: projectId,
        teamId: newTeam.id,
        assignedBy: currentUser.id,
        assignedAt: new Date()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        teamId: newTeam.id,
        name: newTeam.name,
        description: newTeam.description,
        createdBy: newTeam.createdBy,
        createdAt: newTeam.createdAt
      },
      message: 'Collaboration created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create collaboration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
