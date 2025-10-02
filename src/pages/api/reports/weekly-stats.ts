import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, clients } from '../../../db/schema';
import { sql, count, gte, lte, and, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    // Calculate date range for this week (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Sunday, don't subtract any days
    
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Build filter conditions to include both completed entries and ongoing timers
    let filterConditions = [
      sql`(
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate} AND ${timeEntries.endTime} IS NOT NULL)
        OR 
        (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
        OR
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate} AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)
      )`,
      eq(clients.archived, false),
      eq(projects.archived, false)
    ];
    
    if (userId) {
      filterConditions.push(sql`${timeEntries.userId} = ${parseInt(userId)}`);
    }

    const dateFilter = and(...filterConditions);

    // Get total hours for the week including ongoing timers
    const totalHoursResult = await db
      .select({
        totalSeconds: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
            WHEN ${timeEntries.durationManual} IS NOT NULL
            THEN ${timeEntries.durationManual}
            WHEN ${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL
            THEN EXTRACT(EPOCH FROM (NOW() - ${timeEntries.startTime}))
            ELSE 0
          END
        ), 0)`.as('total_seconds')
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(dateFilter);

    // Debug: Get individual time entries for this week including ongoing timers
    const debugEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        calculatedDuration: sql<number>`CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          WHEN ${timeEntries.durationManual} IS NOT NULL
          THEN ${timeEntries.durationManual}
          WHEN ${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL
          THEN EXTRACT(EPOCH FROM (NOW() - ${timeEntries.startTime}))
          ELSE 0
        END`.as('calculated_duration'),
        taskName: sql<string>`'General'`.as('taskName'),
        projectName: projects.name,
        clientName: clients.name
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(dateFilter)
      .orderBy(timeEntries.startTime);

    console.log('Weekly Stats Debug - Date Range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId: userId
    });

    console.log('Weekly Stats Debug - Individual Entries:', debugEntries.map(entry => ({
      id: entry.id,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationManual: entry.durationManual,
      calculatedDuration: entry.calculatedDuration,
      durationHours: (entry.calculatedDuration / 3600).toFixed(2),
      taskName: entry.taskName,
      projectName: entry.projectName,
      clientName: entry.clientName
    })));

    console.log('Weekly Stats Debug - Total:', {
      totalSeconds: totalHoursResult[0]?.totalSeconds,
      totalHours: (totalHoursResult[0]?.totalSeconds || 0) / 3600
    });

    const totalHours = totalHoursResult[0]?.totalSeconds || 0;

    // Format date range for display (e.g., "9/14-9/20")
    const formatDateForDisplay = (date: Date) => {
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      const day = date.getDate();
      return `${month}/${day}`;
    };

    const dateRangeDisplay = `${formatDateForDisplay(startDate)}-${formatDateForDisplay(endDate)}`;

    return new Response(JSON.stringify({
      totalHours,
      period: 'This Week',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dateRangeDisplay
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch weekly stats'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 