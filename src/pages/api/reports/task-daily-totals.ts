import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, tasks, projects, clients, taskAssignments } from '../../../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const startParam = url.searchParams.get('startDate');
    const endParam = url.searchParams.get('endDate');
    const tzOffsetParam = url.searchParams.get('tzOffset'); // Timezone offset in minutes (e.g., -480 for PST)
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse timezone offset (default to 0 if not provided)
    const tzOffsetMinutes = tzOffsetParam ? parseInt(tzOffsetParam) : 0;

    // Determine date range (Sunday to Saturday) or use provided range
    let startDate: Date;
    let endDate: Date;

    if (startParam || endParam) {
      if (!startParam || !endParam) {
        return new Response(JSON.stringify({ error: 'Both startDate and endDate are required when specifying a range' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      startDate = new Date(startParam);
      endDate = new Date(endParam);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
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

    console.log('Task daily totals debug:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get all projects that the user has time entries for in the selected date range
    // Since we're now using projects as tasks, we get projects directly
    const projectsWithEntries = await db
      .selectDistinct({
        id: projects.id,
        name: projects.name,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(timeEntries.userId, parseInt(userId)),
          sql`(
            (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
            OR 
            (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
          )`,
          eq(clients.archived, false),
          eq(projects.archived, false)
        )
      );

    // Use projects as tasks since we're now using projects as the main entities
    const allTasks = projectsWithEntries;

    console.log('Projects considered for weekly grid:', { total: allTasks.length });

    // Then get time entries for each project in the date range with SQL-calculated durations
    const timeEntriesData = await db
      .select({
        taskId: timeEntries.projectId, // Map projectId to taskId for backward compatibility
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
      .where(
        and(
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
        )
      );

    // Calculate day of week based on the date the user sees in their timezone
    // We use UTC date components and apply the user's timezone offset to get the correct local date
    const timeEntriesWithDayOfWeek = timeEntriesData.map(entry => {
      const entryDate = entry.startTime || entry.createdAt;
      if (!entryDate) return { ...entry, dayOfWeek: 0 };
      
      // Convert UTC timestamp to user's local date
      // getTimezoneOffset() returns minutes to ADD to UTC to get local time
      // So we SUBTRACT to convert UTC to local
      const utcDate = new Date(entryDate);
      const utcTime = utcDate.getTime();
      
      // Apply timezone offset to get local time (subtract because offset is positive for timezones behind UTC)
      const localTime = utcTime - (tzOffsetMinutes * 60 * 1000);
      const localDate = new Date(localTime);
      
      // Extract local date components (use getFullYear/getMonth/getDate, not UTC methods)
      // This gives us the date the user sees in their timezone
      const year = localDate.getUTCFullYear();
      const month = localDate.getUTCMonth();
      const day = localDate.getUTCDate();
      
      // Note: After applying timezone offset, the Date object represents local time
      // but we need to use UTC methods because the Date object is still in UTC internally
      // The offset we applied gives us the correct local date components
      
      // Create a date object in UTC with just the date (no time) to determine day of week
      // This represents the calendar date the user sees
      const dateOnly = new Date(Date.UTC(year, month, day));
      const dayOfWeek = dateOnly.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      return { ...entry, dayOfWeek };
    });

    console.log('Time entries in date range:', timeEntriesWithDayOfWeek);
    console.log('Time entries count:', timeEntriesWithDayOfWeek.length);

    // Process the data to calculate daily totals per task
    const taskDailyData = allTasks.map(task => {
      const dayTotals = [];
      
      // Create array for each day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      for (let i = 0; i < 7; i++) {
        let totalSeconds = 0;
        
        // Find all time entries for this task on this day of the week
        const taskEntries = timeEntriesWithDayOfWeek.filter(entry => {
          if (entry.taskId !== task.id) return false;
          return entry.dayOfWeek === i;
        });
        
        // Calculate total seconds for this day using SQL-calculated duration
        taskEntries.forEach(entry => {
          totalSeconds += parseInt(entry.calculatedDuration.toString());
        });
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        dayTotals.push({
          dayOfWeek: i,
          totalSeconds,
          hours,
          minutes,
          formatted: totalSeconds > 0 ? `${hours}h ${minutes}m` : '0h 0m'
        });
      }
      
      return {
        taskId: task.id,
        taskName: task.name,
        projectName: task.projectName,
        clientName: task.clientName,
        dayTotals
      };
    });

    return new Response(JSON.stringify({
      taskDailyData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error fetching task daily totals:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', message);
    if (stack) console.error('Error stack:', stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};