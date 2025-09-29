import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, projects, clients, taskAssignments, timeEntries } from '../../../db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const assignedTo = url.searchParams.get('assignedTo');
    const assignedOnly = url.searchParams.get('assignedOnly') === 'true';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 200;

    const userId = assignedTo ? parseInt(assignedTo) : undefined;

    const assigned = userId ? await db
      .select({ id: tasks.id, name: tasks.name })
      .from(tasks)
      .innerJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(taskAssignments.userId, userId),
        eq(tasks.archived, false),
        sql`COALESCE(${tasks.isSystem}, false) = false`,
        eq(clients.archived, false)
      ))
      .orderBy(desc(tasks.createdAt))
      .limit(limit) : [];

    const withEntries = userId ? await db
      .select({ id: tasks.id, name: tasks.name })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, userId),
        eq(tasks.archived, false),
        sql`COALESCE(${tasks.isSystem}, false) = false`,
        eq(clients.archived, false)
      ))
      .orderBy(desc(tasks.createdAt))
      .limit(limit) : [];

    const allNonArchived = assignedOnly ? [] : await db
      .select({ id: tasks.id, name: tasks.name, projectName: projects.name, clientName: clients.name })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(tasks.archived, false),
        sql`COALESCE(${tasks.isSystem}, false) = false`,
        eq(clients.archived, false)
      ))
      .orderBy(desc(tasks.createdAt))
      .limit(limit);

    const map = new Map<number, any>();
    for (const t of assigned) map.set(t.id, t);
    for (const t of withEntries) map.set(t.id, t);
    for (const t of allNonArchived) map.set(t.id, t);
    const merged = Array.from(map.values());

    return new Response(JSON.stringify({
      input: { assignedTo: userId, assignedOnly, limit },
      counts: {
        assigned: assigned.length,
        withEntries: withEntries.length,
        allNonArchived: allNonArchived.length,
        merged: merged.length
      },
      sample: merged.slice(0, 20)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('debug/tasks-list error', err);
    return new Response(JSON.stringify({ error: 'debug failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


