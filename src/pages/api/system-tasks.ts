import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const searchParams = url.searchParams;
    const assignedTo = searchParams.get('assignedTo');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If assignedTo is provided, use that; otherwise use the authenticated user
    const userId = assignedTo ? parseInt(assignedTo) : user.id;

    const systemTasks = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        status: tasks.status,
        archived: tasks.archived,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        projectId: projects.id,
        clientName: clients.name,
        clientId: clients.id,
        displayName: sql<string>`CONCAT(${projects.name}, ' - ', ${tasks.name})`.as('display_name')
      })
      .from(tasks)
      .innerJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(taskAssignments.userId, userId),
        eq(tasks.archived, false),
        eq(tasks.isSystem, true), // Only include system-generated tasks
        eq(projects.isSystem, true), // Only include system-generated projects
        eq(clients.archived, false)
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    return new Response(JSON.stringify({
      data: systemTasks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching system tasks:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch system tasks'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
