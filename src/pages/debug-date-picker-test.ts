/**
 * Debug test for date picker functionality with manual duration entries
 * This endpoint helps test the date picker logic without the full UI
 */

import type { APIRoute } from 'astro';
import { TimeEntryService } from '../services/timeEntryService';
import { isTokenExpired } from '../utils/auth';
import { db } from '../db';
import { sessions, timeEntries } from '../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Get authenticated user
    const token = cookies.get('session_token')?.value;
    let user = null;

    if (token) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
        with: { user: true }
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

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get manual duration entries for testing
    const manualEntries = await db
      .select()
      .from(timeEntries)
      .where(
        eq(timeEntries.userId, user.id)
      )
      .orderBy(timeEntries.createdAt);

    const testEntries = manualEntries.filter(entry => 
      entry.durationManual && !entry.startTime && !entry.endTime
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Manual duration entries for date picker testing',
      data: {
        totalEntries: manualEntries.length,
        manualEntries: testEntries.length,
        entries: testEntries.map(entry => ({
          id: entry.id,
          durationManual: entry.durationManual,
          startTime: entry.startTime,
          endTime: entry.endTime,
          createdAt: entry.createdAt,
          notes: entry.notes
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in date picker test:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get authenticated user
    const token = cookies.get('session_token')?.value;
    let user = null;

    if (token) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
        with: { user: true }
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

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { entryId, newDate } = body;

    if (!entryId || !newDate) {
      return new Response(JSON.stringify({ error: 'Entry ID and new date are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test updating a manual duration entry's date
    const [year, month, day] = newDate.split('-').map(Number);
    const newCreatedAt = new Date(year, month - 1, day, 12, 0, 0, 0);

    const updateRequest = {
      createdAt: newCreatedAt.toISOString()
    };

    console.log('🧪 Testing date picker update:', {
      entryId,
      newDate,
      newCreatedAt: newCreatedAt.toISOString(),
      updateRequest
    });

    const updatedEntry = await TimeEntryService.updateTimeEntry(parseInt(entryId), updateRequest);

    return new Response(JSON.stringify({
      success: true,
      message: 'Date picker test successful',
      data: {
        entryId,
        oldDate: newDate,
        newCreatedAt: updatedEntry.createdAt,
        updatedEntry: {
          id: updatedEntry.id,
          durationManual: updatedEntry.durationManual,
          startTime: updatedEntry.startTime,
          endTime: updatedEntry.endTime,
          createdAt: updatedEntry.createdAt
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in date picker test:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
