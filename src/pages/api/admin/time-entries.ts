import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { timeEntries } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { parseTimeInput } from '../../../utils/timeParser';

export const GET: APIRoute = async () => {
  try {
    const allTimeEntries = await db.select().from(timeEntries);
    return new Response(JSON.stringify(allTimeEntries), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch time entries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, taskId, duration, notes } = body;

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

    const newTimeEntry = await db.insert(timeEntries).values({
      userId: parseInt(userId),
      taskId: parseInt(taskId),
      startTime: new Date(), // Use current time as start time
      endTime: null, // No end time for manual entries
      durationManual: durationSeconds,
      notes: notes || null,
    }).returning();

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
    const { id, userId, taskId, duration, notes } = body;

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

    const updatedTimeEntry = await db
      .update(timeEntries)
      .set({ 
        userId: parseInt(userId),
        taskId: parseInt(taskId),
        durationManual: durationSeconds,
        notes: notes || null,
        updatedAt: new Date() 
      })
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