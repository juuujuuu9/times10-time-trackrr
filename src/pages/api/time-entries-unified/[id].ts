/**
 * Unified time entry by ID API endpoint
 * Handles individual time entry operations (GET, PUT, DELETE)
 */

import type { APIRoute } from 'astro';
import { TimeEntryService } from '../../../services/timeEntryService';
import { UpdateTimeEntryRequest } from '../../../services/types';
import { isTokenExpired } from '../../../utils/auth';
import { db } from '../../../db';
import { sessions, timeEntries } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get a specific time entry by ID
 */
export const GET: APIRoute = async ({ params, cookies }) => {
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

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entry = await TimeEntryService.getTimeEntry(parseInt(entryId));
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Time entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check ownership
    if (user.role !== 'admin' && entry.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ data: entry }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching time entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch time entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Update a time entry
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
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

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check ownership
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

    if (user.role !== 'admin' && currentEntry[0].userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const updateRequest: UpdateTimeEntryRequest = body;

    const updatedEntry = await TimeEntryService.updateTimeEntry(parseInt(entryId), updateRequest);

    // Calculate duration for the response
    const duration = updatedEntry.durationManual || 
      (updatedEntry.startTime && updatedEntry.endTime ? 
        Math.floor((updatedEntry.endTime.getTime() - updatedEntry.startTime.getTime()) / 1000) : 0);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...updatedEntry,
        duration: duration
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating time entry:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Delete a time entry
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
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

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check ownership
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

    if (user.role !== 'admin' && currentEntry[0].userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await TimeEntryService.deleteTimeEntry(parseInt(entryId));

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
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
