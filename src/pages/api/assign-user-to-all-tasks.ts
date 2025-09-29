import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { tasks, taskAssignments, projects, clients } from '../../db/schema';
import { and, eq, sql, notInArray } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = Number(body.userId || 202); // default to George Eubank (prod id)
    const includeSystem = body.includeSystem === undefined ? true : !!body.includeSystem;

    if (!userId || Number.isNaN(userId)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all active tasks (optionally include system tasks) under non-archived clients/projects
    const activeTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(tasks.archived, false),
          eq(projects.archived, false),
          eq(clients.archived, false),
          includeSystem ? sql`TRUE` : eq(tasks.isSystem, false)
        )
      );

    const allTaskIds = activeTasks.map(t => t.id);

    if (allTaskIds.length === 0) {
      return new Response(JSON.stringify({ success: true, assigned: 0, message: 'No active tasks found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get tasks already assigned to the user
    const existing = await db
      .select({ taskId: taskAssignments.taskId })
      .from(taskAssignments)
      .where(eq(taskAssignments.userId, userId));

    const existingIds = new Set(existing.map(e => e.taskId));
    const toAssignIds = allTaskIds.filter(id => !existingIds.has(id));

    if (toAssignIds.length === 0) {
      return new Response(JSON.stringify({ success: true, assigned: 0, message: 'User already assigned to all active tasks' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rows = toAssignIds.map(id => ({ taskId: id, userId }));
    await db.insert(taskAssignments).values(rows);

    return new Response(JSON.stringify({ success: true, assigned: rows.length, userId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
