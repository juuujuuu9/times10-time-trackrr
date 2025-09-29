import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, projects, clients, taskAssignments, timeEntries } from '../../db/schema';
import { and, eq, sql, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userIdParam = url.searchParams.get('userId');
    if (!userIdParam) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const userId = parseInt(userIdParam);

    // Assigned tasks
    const assigned = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(taskAssignments.userId, userId), eq(tasks.archived, false), eq(clients.archived, false)));

    // With entries
    const withEntries = await db
      .select({ id: tasks.id })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(timeEntries.userId, userId), eq(tasks.archived, false), eq(clients.archived, false)));

    // All visible
    const allVisible = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(tasks.archived, false), eq(clients.archived, false)));

    // Sample list for quick inspection
    const sample = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(tasks.archived, false), eq(clients.archived, false)))
      .orderBy(desc(tasks.createdAt))
      .limit(20);

    return new Response(JSON.stringify({
      counts: {
        assigned: assigned.length,
        withEntries: withEntries.length,
        allVisible: allVisible.length
      },
      sample
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'debug failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
