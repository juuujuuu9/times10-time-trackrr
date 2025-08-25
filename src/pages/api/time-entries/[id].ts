import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, sessions, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { isTokenExpired } from '../../../utils/auth';
import { parseTimeString } from '../../../utils/timeParser';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Get authenticated user
    const token = cookies.get('session_token')?.value;
    let user = null;

    if (token) {
      // Find session and user
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
        with: {
          user: true
        }
      });

      if (session && !isTokenExpired(session.expiresAt) && session.user.status === 'active') {
        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          status: session.user.status
        };
      }
    }

    // Require authentication
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { startTime, endTime, duration } = body;

    // Validate that at least one time is provided (unless this is a manual duration entry)
    if (!startTime && !endTime && !body.duration) {
      return new Response(JSON.stringify({ error: 'At least startTime, endTime, or duration must be provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the current time entry to verify ownership and get base date
    const currentEntry = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, parseInt(entryId)))
      .limit(1);

    if (currentEntry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entry = currentEntry[0];

    // Verify the user owns this time entry
    if (user && entry.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to modify this time entry' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the times if provided
    let newStartTime = entry.startTime;
    let newEndTime = entry.endTime;

    if (startTime) {
      try {
        // Check if it's a datetime-local format (ISO string)
        if (startTime.includes('T') && startTime.includes('-')) {
          newStartTime = new Date(startTime);
          if (isNaN(newStartTime.getTime())) {
            throw new Error('Invalid datetime format');
          }
        } else {
          // Use the original start time as base date for time parser
          const baseDate = new Date(entry.startTime);
          newStartTime = parseTimeString(startTime, baseDate);
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: `Invalid start time format: ${startTime}. Supported formats: 12p, 12:30am, 1230 p, 12:00 PM, etc. or ISO datetime format.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (endTime) {
      try {
        // Check if it's a datetime-local format (ISO string)
        if (endTime.includes('T') && endTime.includes('-')) {
          newEndTime = new Date(endTime);
          if (isNaN(newEndTime.getTime())) {
            throw new Error('Invalid datetime format');
          }
        } else {
          // Use the original end time as base date, or start time if no end time exists
          const baseDate = entry.endTime ? new Date(entry.endTime) : new Date(entry.startTime);
          newEndTime = parseTimeString(endTime, baseDate);
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: `Invalid end time format: ${endTime}. Supported formats: 12p, 12:30am, 1230 p, 12:00 PM, etc. or ISO datetime format.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate that end time is after start time (only if both times are being updated)
    if (startTime && endTime && newEndTime && newStartTime && newEndTime <= newStartTime) {
      return new Response(JSON.stringify({ error: 'End time must be after start time' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If only start time is being updated, check against existing end time
    if (startTime && !endTime && entry.endTime && newStartTime >= entry.endTime) {
      return new Response(JSON.stringify({ error: 'Start time must be before existing end time' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If only end time is being updated, check against existing start time
    if (!startTime && endTime && entry.startTime && newEndTime <= entry.startTime) {
      return new Response(JSON.stringify({ error: 'End time must be after existing start time' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate new duration if both times are provided, or use provided duration
    let newDurationManual = entry.durationManual;
    if (newStartTime && newEndTime) {
      const durationMs = newEndTime.getTime() - newStartTime.getTime();
      newDurationManual = Math.floor(durationMs / 1000); // Convert to seconds
    } else if (duration) {
      // Parse duration string using the existing time parser
      try {
        const { parseTimeInput } = await import('../../../utils/timeParser');
        newDurationManual = parseTimeInput(duration);
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Invalid duration format. Use formats like "2h", "3.5hr", "4:15", "90m", "5400s"' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (startTime) {
      updateData.startTime = newStartTime;
    }
    
    if (endTime) {
      updateData.endTime = newEndTime;
    }
    
    if (newDurationManual !== undefined) {
      updateData.durationManual = newDurationManual;
    }
    
    // For manual duration entries, clear start and end times
    if (duration && !startTime && !endTime) {
      updateData.startTime = null;
      updateData.endTime = null;
    }

    // Update the time entry
    const updatedEntry = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, parseInt(entryId)))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      data: updatedEntry[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating time entry:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;
    const token = cookies.get('session_token')?.value;
    let user = null;

    if (token) {
      // Find session and user
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
        with: {
          user: true
        }
      });

      if (session && !isTokenExpired(session.expiresAt) && session.user.status === 'active') {
        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          status: session.user.status
        };
      }
    }

    // Require authentication
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ error: 'Time entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the time entry to verify ownership
    const entry = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
      })
      .from(timeEntries)
      .where(eq(timeEntries.id, parseInt(id)))
      .limit(1);

    if (entry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the user owns this time entry
    if (entry[0].userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this time entry' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the time entry
    const deletedEntry = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, parseInt(id)))
      .returning();

    if (deletedEntry.length === 0) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Time entry deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting time entry:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
