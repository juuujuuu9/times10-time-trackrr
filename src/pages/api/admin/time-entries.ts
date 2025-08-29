import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { timeEntries, users, tasks, projects, clients } from '../../../db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { parseTimeInput } from '../../../utils/timeParser';

export const GET: APIRoute = async () => {
  try {
    // Get all time entries with related data (only non-archived activities)
    const allTimeEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
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
      .where(and(
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false)
      ))
      .orderBy(sql`${timeEntries.createdAt} DESC`);

    return new Response(JSON.stringify(allTimeEntries), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch time entries' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, taskId, duration, notes, taskDate } = body;

    if (!userId || !taskId || !duration) {
      return new Response(JSON.stringify({ error: 'User ID, task ID, and duration are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse duration input (e.g., "2h", "3.5hr", "4:15", etc.)
    let durationSeconds: number;
    try {
      durationSeconds = parseTimeInput(duration);
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid duration format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For manual duration entries, set startTime to the task date to indicate when the work was done
    // The endTime remains null since we only have duration, not start/end times
    const taskStartTime = taskDate ? new Date(taskDate) : new Date();

    const newTimeEntry = await db.insert(timeEntries).values({
      userId: parseInt(userId),
      taskId: parseInt(taskId),
      startTime: taskStartTime, // Set to the task date for manual entries
      endTime: null, // No end time for manual entries
      durationManual: durationSeconds,
      notes: notes || null,
    }).returning();

    // Update task status to "in-progress" if it's currently "pending"
    await db
      .update(tasks)
      .set({ status: 'in-progress' })
      .where(
        and(
          eq(tasks.id, parseInt(taskId)),
          eq(tasks.status, 'pending')
        )
      );

    return new Response(JSON.stringify(newTimeEntry[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to create time entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, userId, taskId, duration, notes, taskDate } = body;

    if (!id || !userId || !taskId || !duration) {
      return new Response(JSON.stringify({ error: 'ID, user ID, task ID, and duration are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse duration input (e.g., "2h", "3.5hr", "4:15", etc.)
    let durationSeconds: number;
    try {
      durationSeconds = parseTimeInput(duration);
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid duration format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data
    const updateData: any = {
      userId: parseInt(userId),
      taskId: parseInt(taskId),
      durationManual: durationSeconds,
      notes: notes || null,
      updatedAt: new Date()
    };

    // For manual duration entries, update startTime to the task date if provided
    if (taskDate) {
      updateData.startTime = new Date(taskDate);
    }

    const updatedTimeEntry = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, parseInt(id)))
      .returning();

    if (updatedTimeEntry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedTimeEntry[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating time entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to update time entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 