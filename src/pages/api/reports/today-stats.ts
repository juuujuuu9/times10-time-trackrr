import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
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

    // Calculate date range for today (using local timezone like other endpoints)
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

    // Get time entries for today using the same logic as other working endpoints
    const todayEntries = await db
      .select({
        id: timeEntries.id,
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
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
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
        eq(tasks.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      ));

    console.log('Today entries found:', todayEntries.length);
    console.log('Today entries data:', todayEntries);

    // Calculate total seconds using SQL-calculated duration
    const totalSeconds = todayEntries.reduce((total, entry) => {
      return total + parseInt(entry.calculatedDuration.toString());
    }, 0);


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
