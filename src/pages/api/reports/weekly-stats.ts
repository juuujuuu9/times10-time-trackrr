import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
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

    // Build filter conditions for non-archived activities - include both startTime-based entries and manual entries
    let filterConditions = [
      sql`(
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
        OR 
        (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
      )`,
      eq(clients.archived, false),
      eq(projects.archived, false),
      // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
      sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
    ];
    
    if (userId) {
      filterConditions.push(sql`${timeEntries.userId} = ${parseInt(userId)}`);
    }

    const dateFilter = and(...filterConditions);

    // Get total hours for the week (only non-archived activities)
    const totalHoursResult = await db
      .select({
        totalSeconds: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
            ELSE COALESCE(${timeEntries.durationManual}, 0)
          END
        ), 0)`.as('total_seconds')
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(dateFilter);

    // Debug: Get individual time entries for this week
    const debugEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        calculatedDuration: sql<number>`CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
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

    // Get completed tasks count (only non-archived activities)
    const completedTasksResult = await db
      .select({
        count: count(sql`DISTINCT ${tasks.id}`)
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false),
        sql`${tasks.status} = 'completed'`
      ));

    // Get active projects count (only non-archived activities)
    const activeProjectsResult = await db
      .select({
        count: count(sql`DISTINCT ${projects.id}`)
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false)
      ));

    const totalHours = totalHoursResult[0]?.totalSeconds || 0;
    const completedTasks = completedTasksResult[0]?.count || 0;
    const activeProjects = activeProjectsResult[0]?.count || 0;

    // Format date range for display (e.g., "9/14-9/20")
    const formatDateForDisplay = (date: Date) => {
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      const day = date.getDate();
      return `${month}/${day}`;
    };

    const dateRangeDisplay = `${formatDateForDisplay(startDate)}-${formatDateForDisplay(endDate)}`;

    return new Response(JSON.stringify({
      totalHours,
      completedTasks,
      activeProjects,
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