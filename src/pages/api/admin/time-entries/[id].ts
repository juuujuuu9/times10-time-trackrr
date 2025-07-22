import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { timeEntries, users, tasks, projects, clients } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Time entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timeEntry = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        userId: timeEntries.userId,
        taskId: timeEntries.taskId,
        userName: users.name,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
      })
      .from(timeEntries)
      .innerJoin(users, sql`${timeEntries.userId} = ${users.id}`)
      .innerJoin(tasks, sql`${timeEntries.taskId} = ${tasks.id}`)
      .innerJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .innerJoin(clients, sql`${projects.clientId} = ${clients.id}`)
      .where(eq(timeEntries.id, parseInt(id)))
      .limit(1);

    if (timeEntry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(timeEntry[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching time entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch time entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Time entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deletedTimeEntry = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, parseInt(id)))
      .returning();

    if (deletedTimeEntry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Time entry deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete time entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 