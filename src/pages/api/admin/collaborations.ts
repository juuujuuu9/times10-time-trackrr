import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers as teamMembersTable, projects, clients } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// GET /api/admin/collaborations - Get all collaborations
export const GET: APIRoute = async (context) => {
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

    // Get all collaborations with project and client information
    const allCollaborations = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        archived: teams.archived,
        projectId: projects.id,
        projectName: projects.name,
        clientId: clients.id,
        clientName: clients.name
      })
      .from(teams)
      .leftJoin(projects, eq(projects.id, teams.projectId))
      .leftJoin(clients, eq(clients.id, projects.clientId))
      .where(eq(teams.archived, false));

    return new Response(JSON.stringify({
      success: true,
      data: allCollaborations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch collaborations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

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
    if (!name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name is required'
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

      // Check if project already has a collaboration (1:1 relationship)
      const existingCollaboration = await db.query.teams.findFirst({
        where: eq(teams.projectId, projectId)
      });

      if (existingCollaboration) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Project already has a collaboration. Each project can only have one collaboration.'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get project name if projectId is provided to use as collaboration name
    let collaborationName = name;
    if (projectId) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });
      if (project) {
        collaborationName = project.name; // Use project name exactly
      }
    }

    // Create the team with projectId included from the start
    const [newTeam] = await db.insert(teams).values({
      name: collaborationName,
      description: description || null, // Allow empty descriptions
      projectId: projectId, // Include projectId in initial creation
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
