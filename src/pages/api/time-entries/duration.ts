import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ValidationService } from '../../../services/validationService';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const taskId = url.searchParams.get('taskId');
    const date = url.searchParams.get('date');

    if (!userId || !taskId || !date) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: userId, taskId, date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse date and create date range
    const [year, month, day] = date.split('-').map(Number);
    const targetDateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const targetDateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    // Check for existing time entries for this task on this specific date
    const existingEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, parseInt(userId)),
          eq(timeEntries.projectId, parseInt(taskId)),
          sql`(
            (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${targetDateStart} AND ${timeEntries.startTime} <= ${targetDateEnd})
            OR 
            (${timeEntries.startTime} IS NULL AND ${timeEntries.createdAt} >= ${targetDateStart} AND ${timeEntries.createdAt} <= ${targetDateEnd})
          )`
        )
      );

    return new Response(JSON.stringify({
      success: true,
      entryCount: existingEntries.length,
      hasMultipleEntries: existingEntries.length > 1,
      entries: existingEntries.map(entry => ({
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
        durationManual: entry.durationManual,
        notes: entry.notes
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error checking entry count:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, taskId, date, duration } = body;

    if (!userId || !taskId || !date || !duration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: userId, taskId, date, duration'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the duration using ValidationService
    const parsedDuration = ValidationService.parseDuration(duration);
    if (!parsedDuration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid duration format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert date to start and end times for the specific day
    const [year, month, day] = date.split('-').map(Number);
    const startTime = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endTime = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Check for existing time entries for this task on this specific date
    const targetDateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const targetDateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    const existingEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.projectId, taskId),
          // More precise date matching
          sql`(
            (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${targetDateStart} AND ${timeEntries.startTime} <= ${targetDateEnd})
            OR 
            (${timeEntries.startTime} IS NULL AND ${timeEntries.createdAt} >= ${targetDateStart} AND ${timeEntries.createdAt} <= ${targetDateEnd})
          )`
        )
      );

    if (existingEntries.length > 0) {
      // Check if there are multiple entries
      if (existingEntries.length > 1) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Multiple time entries exist for this day',
          message: `There are ${existingEntries.length} time entries for this day. Please edit individual entries instead of using duration editing.`,
          entryCount: existingEntries.length,
          multipleEntries: true
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Single entry exists - update it
      const entry = existingEntries[0];
      const updateData = {
        durationManual: parsedDuration,
        updatedAt: new Date()
      };

      await db
        .update(timeEntries)
        .set(updateData)
        .where(eq(timeEntries.id, entry.id));

      return new Response(JSON.stringify({
        success: true,
        message: 'Duration updated successfully',
        data: { ...entry, ...updateData }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Create new time entry with manual duration
      const newEntry = {
        userId,
        projectId: taskId,
        startTime,
        endTime,
        durationManual: parsedDuration,
        notes: 'Manual duration entry',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.insert(timeEntries).values(newEntry).returning();

      return new Response(JSON.stringify({
        success: true,
        message: 'Duration entry created successfully',
        data: result[0]
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error handling duration update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
