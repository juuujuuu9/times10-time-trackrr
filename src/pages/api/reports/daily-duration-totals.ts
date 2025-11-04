import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
import { sql, and, eq, gte, lte } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const tzOffsetParam = searchParams.get('tzOffset'); // Timezone offset in minutes (e.g., -480 for PST)
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse timezone offset (default to 0 if not provided)
    const tzOffsetMinutes = tzOffsetParam ? parseInt(tzOffsetParam) : 0;

    // Determine week (Sunday to Saturday) or use provided range
    let startDate: Date;
    let endDate: Date;

    if (startParam || endParam) {
      // If either provided, require both for clarity
      if (!startParam || !endParam) {
        return new Response(JSON.stringify({ error: 'Both startDate and endDate are required when specifying a range' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      startDate = new Date(startParam);
      endDate = new Date(endParam);
      // Normalize to day bounds
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current week (Sunday to Saturday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToSubtract);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get time entries for the current week
    const timeEntriesData = await db
      .select({
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
        calculatedDuration: sql<number>`CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END`.as('calculated_duration')
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, parseInt(userId)),
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      ));

    // Calculate day of week based on the date the user sees in their timezone
    // We use UTC date components and apply the user's timezone offset to get the correct local date
    const dailyTotalsMapLocal = new Map<number, number>();
    
    timeEntriesData.forEach(entry => {
      const entryDate = entry.startTime || entry.createdAt;
      if (!entryDate) return;
      
      // Convert UTC timestamp to user's local date
      // getTimezoneOffset() returns the offset in minutes from UTC
      // For PST (UTC-8): offset = 480 (positive means behind UTC)
      // Formula: LocalTime = UTCTime - offset
      const utcDate = new Date(entryDate);
      const utcTime = utcDate.getTime();
      
      // Apply timezone offset to get the local time timestamp
      // Subtract offset to convert UTC to local (since offset is positive for timezones behind UTC)
      const localTime = utcTime - (tzOffsetMinutes * 60 * 1000);
      const localDate = new Date(localTime);
      
      // Extract date components from the adjusted timestamp
      // The adjusted Date object represents the user's local time, but internally it's still UTC
      // We use UTC methods to extract the date components that represent the user's local date
      const year = localDate.getUTCFullYear();
      const month = localDate.getUTCMonth();
      const day = localDate.getUTCDate();
      
      // Calculate day of week for this date
      // Use the date components directly to determine day of week
      // This works because day of week is the same globally for a given calendar date
      const dateOnly = new Date(Date.UTC(year, month, day));
      const dayOfWeek = dateOnly.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      const duration = parseInt(entry.calculatedDuration.toString());
      const currentTotal = dailyTotalsMapLocal.get(dayOfWeek) || 0;
      dailyTotalsMapLocal.set(dayOfWeek, currentTotal + duration);
    });

    // Convert map to array format
    const dailyTotals = Array.from(dailyTotalsMapLocal.entries()).map(([dayOfWeek, totalSeconds]) => ({
      dayOfWeek,
      totalSeconds
    }));

    // Debug: Log the raw results
    console.log('Daily duration totals debug:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      rawResults: dailyTotals
    });

    // Debug: Check if there are any time entries for this user at all
    const allEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt
      })
      .from(timeEntries)
      .where(eq(timeEntries.userId, parseInt(userId)))
      .limit(5);
    
    console.log('All time entries for user:', allEntries);

    // Create a map of day of week to total seconds
    const dailyTotalsMap = new Map<number, number>();
    dailyTotals.forEach(day => {
      // Convert string to number for dayOfWeek
      const dayOfWeek = parseInt(day.dayOfWeek.toString());
      const totalSeconds = parseInt(day.totalSeconds.toString());
      dailyTotalsMap.set(dayOfWeek, totalSeconds);
    });

    // Create array for each day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const weekTotals = [];
    for (let i = 0; i < 7; i++) {
      const totalSeconds = dailyTotalsMap.get(i) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      weekTotals.push({
        dayOfWeek: i,
        totalSeconds,
        hours,
        minutes,
        formatted: `${hours}h ${minutes}m`
      });
    }

    return new Response(JSON.stringify({
      weekTotals,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching daily duration totals:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch daily duration totals'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
