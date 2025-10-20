/**
 * Unified time entries API endpoint
 * Handles all time entry operations with consistent validation and timezone handling
 */

import type { APIRoute } from 'astro';
import { TimeEntryService } from '../../services/timeEntryService';
import type { CreateTimeEntryRequest, UpdateTimeEntryRequest } from '../../services/types';
import { isTokenExpired } from '../../utils/auth';
import { db } from '../../db';
import { sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get time entries for a user or all entries (admin)
 */
export const GET: APIRoute = async ({ url, cookies }) => {
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

    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    let entries;
    if (user.role === 'admin' && !userId) {
      // Admin can get all entries
      entries = await TimeEntryService.getAllTimeEntries();
    } else {
      // Get entries for specific user
      const targetUserId = userId ? parseInt(userId) : user.id;
      
      // Non-admin users can only access their own entries
      if (user.role !== 'admin' && targetUserId !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      entries = await TimeEntryService.getUserTimeEntries(targetUserId, limit);
    }

    return new Response(JSON.stringify({ data: entries }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching time entries:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch time entries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Create a new time entry
 */
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
    const createRequest: CreateTimeEntryRequest = {
      ...body,
      userId: body.userId || user.id, // Use provided userId or current user
    };

    // Non-admin users can only create entries for themselves
    if (user.role !== 'admin' && createRequest.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newEntry = await TimeEntryService.createTimeEntry(createRequest);

    return new Response(JSON.stringify({
      data: newEntry,
      message: 'Time entry created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating time entry:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create time entry'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
