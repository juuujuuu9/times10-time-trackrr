import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { clients, projects, tasks, timeEntries, taskAssignments } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (client.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(client[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch client', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      return new Response(JSON.stringify({ error: 'Invalid client ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete in order to avoid foreign key constraint violations
    // 1. First, get all projects for this client
    const clientProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.clientId, clientId));

    const projectIds = clientProjects.map(p => p.id);

    if (projectIds.length > 0) {
      // 2. Get all tasks for these projects
      const projectTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(inArray(tasks.projectId, projectIds));

      const taskIds = projectTasks.map(t => t.id);

      if (taskIds.length > 0) {
        // 3. Delete time entries for these tasks
        await db
          .delete(timeEntries)
          .where(inArray(timeEntries.taskId, taskIds));

        // 4. Delete task assignments for these tasks
        await db
          .delete(taskAssignments)
          .where(inArray(taskAssignments.taskId, taskIds));

        // 5. Delete the tasks
        await db
          .delete(tasks)
          .where(inArray(tasks.projectId, projectIds));
      }

      // 6. Delete the projects
      await db
        .delete(projects)
        .where(eq(projects.clientId, clientId));
    }

    // 7. Finally, delete the client
    const deletedClient = await db
      .delete(clients)
      .where(eq(clients.id, clientId))
      .returning();

    if (deletedClient.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Client deleted successfully:', deletedClient[0]);

    return new Response(JSON.stringify({ 
      message: 'Client deleted successfully. All associated projects, tasks, and time entries have been removed.',
      deletedClientId: clientId,
      deletedClientName: deletedClient[0].name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to delete client';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        errorMessage = 'Cannot delete client: It has associated projects or other data';
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