import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, clients } from '../../../db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate date range for today (using the same proven approach as weekly-stats)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    console.log('Today stats debug:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

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

    // Get total hours for today including ongoing timers
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

    // Debug: Get individual time entries for today including ongoing timers
    const debugEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
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

    console.log('Today Stats Debug - Individual Entries:', debugEntries.map(entry => ({
      id: entry.id,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationManual: entry.durationManual,
      createdAt: entry.createdAt,
      calculatedDuration: entry.calculatedDuration,
      durationHours: (entry.calculatedDuration / 3600).toFixed(2),
      taskName: entry.taskName,
      projectName: entry.projectName,
      clientName: entry.clientName
    })));

    console.log('Today Stats Debug - Total:', {
      totalSeconds: totalHoursResult[0]?.totalSeconds,
      totalHours: (totalHoursResult[0]?.totalSeconds || 0) / 3600
    });

    const totalSeconds = totalHoursResult[0]?.totalSeconds || 0;

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalHours: totalSeconds,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching today stats:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch today stats',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
