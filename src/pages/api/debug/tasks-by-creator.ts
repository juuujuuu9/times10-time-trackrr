import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, projects, clients, users } from '../../../db/schema';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Count tasks grouped by client creator
    const rows = await db
      .select({
        createdBy: clients.createdBy,
        creatorName: users.name,
        taskCount: sql<number>`COUNT(${tasks.id})`.as('task_count')
      })
      .from(tasks)
      .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
      .leftJoin(users, sql`${clients.createdBy} = ${users.id}`)
      .groupBy(clients.createdBy, users.name)
      .orderBy(sql`COUNT(${tasks.id}) DESC`);

    // Also include a quick sample of 10 tasks with their client creator
    const sample = await db
      .select({
        taskId: tasks.id,
        taskName: tasks.name,
        clientName: clients.name,
        projectName: projects.name,
        createdBy: clients.createdBy,
        creatorName: users.name
      })
      .from(tasks)
      .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
      .leftJoin(users, sql`${clients.createdBy} = ${users.id}`)
      .limit(10);

    return new Response(JSON.stringify({ rows, sample }), {
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


