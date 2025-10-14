import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { clients, projects, tasks, timeEntries, taskAssignments } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return new Response(JSON.stringify({ error: 'Invalid client ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admins can delete clients
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only administrators can delete clients' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId)
    });

    if (!client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting deletion of client ${clientId} (${client.name})`);

    // Delete in order to avoid foreign key constraint violations
    // 1. Get all projects for this client
    const clientProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.clientId, clientId));

    const projectIds = clientProjects.map(p => p.id);

    if (projectIds.length > 0) {
      console.log(`Found ${projectIds.length} projects to delete`);

      // 2. Get all tasks for these projects
      const projectTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(inArray(tasks.projectId, projectIds));

      const taskIds = projectTasks.map(t => t.id);

      if (taskIds.length > 0) {
        console.log(`Found ${taskIds.length} tasks to delete`);

        // 3. Delete task assignments for these tasks
        await db
          .delete(taskAssignments)
          .where(inArray(taskAssignments.taskId, taskIds));

        // 4. Delete the tasks
        await db
          .delete(tasks)
          .where(inArray(tasks.projectId, projectIds));
      }

      // 5. Delete time entries for these projects
      await db
        .delete(timeEntries)
        .where(inArray(timeEntries.projectId, projectIds));

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

    console.log(`Client ${clientId} (${client.name}) deleted successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Client deleted successfully',
      data: deletedClient[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete client', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
