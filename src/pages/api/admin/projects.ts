import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { projects, clients } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Get all projects with client information, filtering out projects from archived clients
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        clientId: projects.clientId,
        archived: projects.archived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientArchived: clients.archived,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(clients.archived, false)); // Only show projects from active clients
    
    // Remove the clientArchived field from the response
    const cleanProjects = allProjects.map(project => ({
      id: project.id,
      name: project.name,
      clientId: project.clientId,
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

    if (!name || !clientId) {
      return new Response(JSON.stringify({ error: 'Project name and client ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newProject = await db.insert(projects).values({
      name,
      clientId: parseInt(clientId),
    }).returning();

    return new Response(JSON.stringify(newProject[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({ error: 'Failed to create project' }), {
      status: 500,
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