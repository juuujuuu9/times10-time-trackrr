import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { timeEntries, users, tasks, projects, clients } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { parseTimeInput } from '../../../../utils/timeParser';

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
        projectId: timeEntries.projectId,
        userName: users.name,
        projectName: projects.name,
        clientName: clients.name,
      })
      .from(timeEntries)
      .innerJoin(users, sql`${timeEntries.userId} = ${users.id}`)
      .innerJoin(projects, sql`${timeEntries.projectId} = ${projects.id}`)
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Time entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { startTime, endTime, duration, notes } = body;

    // Validate that we have either start/end times or duration
    if (!startTime && !endTime && !duration) {
      return new Response(JSON.stringify({ error: 'Either start/end times or duration must be provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If start/end times are provided, both must be provided
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return new Response(JSON.stringify({ error: 'Both start and end times must be provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let updateData: any = {};

    if (startTime && endTime) {
      // Calculate duration from start and end times
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      
      updateData = {
        startTime: start,
        endTime: end,
        durationManual: durationSeconds,
        notes: notes || null
      };
    } else if (duration) {
      // Parse duration string using the existing time parser
      try {
        const durationSeconds = parseTimeInput(duration);
        
        updateData = {
          durationManual: durationSeconds,
          endTime: null, // Clear end time for manual duration entries
          notes: notes || null
        };
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Invalid duration format. Use formats like "2h", "3.5hr", "4:15", "90m", "5400s"' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    return new Response(JSON.stringify({ 
      message: 'Time entry updated successfully',
      data: updatedTimeEntry[0]
    }), {
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