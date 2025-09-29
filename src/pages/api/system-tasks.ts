import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients, timeEntries } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const searchParams = url.searchParams;
  const assignedTo = searchParams.get('assignedTo');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200; // show more by default
    
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

    // 1) System tasks explicitly assigned to the user
    const assignedSystemTasks = await db
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

    // 2) Additionally include any system tasks the user has time entries for in last 180 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 180);

    const systemTasksWithEntries = await db
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
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, userId),
        eq(tasks.archived, false),
        eq(tasks.isSystem, true),
        eq(projects.isSystem, true),
        eq(clients.archived, false)
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    // Merge and dedupe by id
    const map = new Map<number, any>();
    for (const t of assignedSystemTasks) map.set(t.id, t);
    for (const t of systemTasksWithEntries) map.set(t.id, t);
    const merged = Array.from(map.values()).slice(0, limit);

    return new Response(JSON.stringify({
      data: merged
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
