import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { projects, clients } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const urlObj = new URL(url);
    const includeArchived = urlObj.searchParams.get('includeArchived') === 'true';
    
    // Build the query based on whether we want archived projects
    let query = db
      .select({
        id: projects.id,
        name: projects.name,
        clientId: projects.clientId,
        clientName: clients.name,
        archived: projects.archived,
        isSystem: projects.isSystem,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientArchived: clients.archived,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id));
    
    // Only show projects from active clients, but include archived projects if requested
    // Exclude system-generated projects from regular listings
    if (includeArchived) {
      // Show all projects from active clients (both archived and non-archived projects)
      query = query.where(and(eq(clients.archived, false), eq(projects.isSystem, false)));
    } else {
      // Show only non-archived projects from active clients
      query = query.where(and(eq(clients.archived, false), eq(projects.archived, false), eq(projects.isSystem, false)));
    }
    
    const allProjects = await query;
    
    // Remove the clientArchived and isSystem fields from the response
    const cleanProjects = allProjects.map(project => ({
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      clientName: project.clientName,
      archived: project.archived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
    
    return new Response(JSON.stringify(cleanProjects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, clientId } = body;

    console.log('Project creation request:', { name, clientId, body });

    if (!name || !clientId) {
      console.error('Missing required fields:', { name, clientId });
      return new Response(JSON.stringify({ error: 'Project name and client ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate clientId is a valid number
    const parsedClientId = parseInt(clientId);
    if (isNaN(parsedClientId)) {
      console.error('Invalid clientId format:', clientId);
      return new Response(JSON.stringify({ error: 'Invalid client ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the client exists
    const client = await db.select().from(clients).where(eq(clients.id, parsedClientId)).limit(1);
    if (client.length === 0) {
      console.error('Client not found:', parsedClientId);
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating project with data:', { name, clientId: parsedClientId });
    const newProject = await db.insert(projects).values({
      name,
      clientId: parsedClientId,
    }).returning();

    console.log('Project created successfully:', newProject[0]);
    return new Response(JSON.stringify(newProject[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create project';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid client reference';
        statusCode = 400;
      } else if (error.message.includes('not null')) {
        errorMessage = 'Required field is missing';
        statusCode = 400;
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'A project with this name already exists for this client';
        statusCode = 409;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, clientId } = body;

    if (!id || !name || !clientId) {
      return new Response(JSON.stringify({ error: 'Project ID, name, and client ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedProject = await db
      .update(projects)
      .set({ 
        name, 
        clientId: parseInt(clientId),
        updatedAt: new Date() 
      })
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (updatedProject.length === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedProject[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(JSON.stringify({ error: 'Failed to update project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, archived } = body;

    if (id === undefined || archived === undefined) {
      return new Response(JSON.stringify({ error: 'Project ID and archived status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedProject = await db
      .update(projects)
      .set({ archived, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    if (updatedProject.length === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedProject[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error archiving/unarchiving project:', error);
    return new Response(JSON.stringify({ error: 'Failed to update project archive status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 