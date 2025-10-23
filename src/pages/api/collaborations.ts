import type { APIRoute } from 'astro';
import { db } from '../../db';
import { teams, teamMembers as teamMembersTable, projects, clients } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

// GET /api/collaborations - Get all collaborations for the current user
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

    // Get collaborations where user is a member with project information
    const userCollaborations = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        userRole: teamMembersTable.role,
        joinedAt: teamMembersTable.joinedAt,
        projectId: projects.id,
        projectName: projects.name,
        clientId: clients.id,
        clientName: clients.name
      })
      .from(teams)
      .innerJoin(teamMembersTable, eq(teamMembersTable.teamId, teams.id))
      .leftJoin(projects, eq(projects.id, teams.projectId))
      .leftJoin(clients, eq(clients.id, projects.clientId))
      .where(and(
        eq(teamMembersTable.userId, currentUser.id),
        eq(teams.archived, false)
      ));

    return new Response(JSON.stringify({
      success: true,
      data: userCollaborations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch collaborations'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/collaborations - Create a new collaboration
export const POST: APIRoute = async (context) => {
  console.log('=== COLLABORATION API CALLED ===');
  console.log('Request URL:', context.request.url);
  console.log('Request method:', context.request.method);
  
  let projectId: number | undefined;
  let description: string | undefined;
  let teamMembers: number[] = [];
  
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

    // Check if user can create collaborations
    if (!['admin', 'developer', 'team_manager'].includes(currentUser.role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions to create collaborations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      return {};
    });
    
    console.log('Raw request body:', body);
    ({ projectId, description, teamMembers = [] } = body);
    
    console.log('Creating collaboration with data:', {
      projectId,
      description,
      teamMembers,
      currentUserId: currentUser.id
    });

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

    // Check if collaboration already exists for this project
    const existingCollaboration = await db.query.teams.findFirst({
      where: and(
        eq(teams.projectId, projectId),
        eq(teams.archived, false)
      )
    });

    if (existingCollaboration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A collaboration for this project already exists'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the collaboration using project name
    const newCollaboration = await db.insert(teams).values({
      name: project.name,
      description: description?.trim() || null,
      projectId: projectId, // Include projectId in the initial insert
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    }).returning();

    const collaborationId = newCollaboration[0].id;

    // Add the creator as a collaboration lead (team manager is automatically included)
    console.log('Adding creator as team lead:', {
      teamId: collaborationId,
      userId: currentUser.id,
      role: 'lead'
    });
    
    await db.insert(teamMembersTable).values({
      teamId: collaborationId,
      userId: currentUser.id,
      role: 'lead',
      joinedAt: new Date()
    });
    
    console.log('Creator added as team lead successfully');

    // Add team members if provided (exclude the creator since they're already added as lead)
    if (teamMembers && teamMembers.length > 0) {
      console.log('Adding team members:', teamMembers);
      
      // Filter out the creator from team members to avoid duplicate
      const filteredTeamMembers = teamMembers.filter(userId => userId !== currentUser.id);
      
      if (filteredTeamMembers.length > 0) {
        const teamMemberInserts = filteredTeamMembers.map((userId: number) => ({
          teamId: collaborationId,
          userId: userId,
          role: 'member',
          joinedAt: new Date()
        }));
        
        console.log('Team member inserts (filtered):', teamMemberInserts);
        const insertResult = await db.insert(teamMembersTable).values(teamMemberInserts);
        console.log('Team members insert result:', insertResult);
        console.log('Team members added successfully');
      } else {
        console.log('No additional team members to add (creator already included)');
      }
    } else {
      console.log('No team members to add');
    }

    // Project assignment is already included in the initial insert

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: collaborationId,
        name: newCollaboration[0].name,
        description: newCollaboration[0].description,
        createdBy: newCollaboration[0].createdBy,
        createdAt: newCollaboration[0].createdAt
      },
      message: 'Collaboration created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating collaboration:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId,
      teamMembers,
      description
    });
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
