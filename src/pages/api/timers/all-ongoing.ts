import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { timeEntries, tasks, users, projects, clients } from '../../../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { requireAuth } from '../../../utils/session';

// GET: Get all ongoing timers for all users
export const GET: APIRoute = async (context) => {
  try {
    const currentUser = await requireAuth(context);
    if (!currentUser || typeof currentUser === 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all ongoing timers with related data (only non-archived activities)
    // Exclude manual duration entries (entries with durationManual but no endTime)
    const ongoingTimers = await db.select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      startTime: timeEntries.startTime,
      notes: timeEntries.notes,
      userId: timeEntries.userId,
      userName: users.name,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        isNull(timeEntries.endTime),
        isNull(timeEntries.durationManual), // Exclude manual duration entries
        sql`${timeEntries.startTime} IS NOT NULL`, // Only include entries with actual start times
        eq(clients.archived, false),
        eq(projects.archived, false)
      )
    )
    .orderBy(timeEntries.startTime);

    // Calculate elapsed time for each timer using timezone-safe methods
    const { getTodayString, createUserDate } = await import('../../../utils/timezoneUtils');
    const now = new Date();
    const todayString = getTodayString();
    
    // For GET requests, we use server time for elapsed calculation (acceptable for display)
    const currentTime = createUserDate(todayString, now.getHours(), now.getMinutes(), now.getSeconds());
    const timersWithElapsed = ongoingTimers.map(timer => {
      const elapsedSeconds = timer.startTime ? Math.floor((currentTime.getTime() - new Date(timer.startTime).getTime()) / 1000) : 0;
      return {
        ...timer,
        elapsedSeconds,
        startTime: timer.startTime // Keep the original time without conversion
      };
    });

    // Debug: Log ongoing timers information
    console.log('Ongoing Timers Debug:', {
      count: timersWithElapsed.length,
      timers: timersWithElapsed.map(timer => ({
        id: timer.id,
        startTime: timer.startTime,
        elapsedSeconds: timer.elapsedSeconds,
        elapsedHours: (timer.elapsedSeconds / 3600).toFixed(2),
        taskName: timer.taskName,
        projectName: timer.projectName,
        clientName: timer.clientName,
        userName: timer.userName
      }))
    });

    return new Response(JSON.stringify({
      success: true,
      data: timersWithElapsed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching ongoing timers:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
