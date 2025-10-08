/**
 * Debug API endpoint to test date picker functionality
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const entryId = url.searchParams.get('entryId');
    
    if (!entryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entry ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the entry from database
    const entry = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, parseInt(entryId)))
      .limit(1);

    if (entry.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entry not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const timeEntry = entry[0];

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: timeEntry.id,
        durationManual: timeEntry.durationManual,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime,
        createdAt: timeEntry.createdAt,
        updatedAt: timeEntry.updatedAt,
        isManualDurationEntry: timeEntry.durationManual && !timeEntry.startTime && !timeEntry.endTime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { entryId, createdAt } = body;

    if (!entryId || !createdAt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entry ID and createdAt are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the entry's createdAt field
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({
        createdAt: new Date(createdAt),
        updatedAt: new Date()
      })
      .where(eq(timeEntries.id, parseInt(entryId)))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedEntry.id,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating entry:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
