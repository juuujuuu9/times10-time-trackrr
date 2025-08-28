import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
import { sql, count, gte, lte, and, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    // Calculate date range for last 7 days (to match admin dashboard default)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Build filter conditions for non-archived activities
    let filterConditions = [
      gte(timeEntries.startTime, startDate), 
      lte(timeEntries.startTime, endDate),
      eq(clients.archived, false),
      eq(projects.archived, false),
      eq(tasks.archived, false)
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
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
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
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
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
        gte(timeEntries.startTime, startDate), 
        lte(timeEntries.startTime, endDate),
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
        gte(timeEntries.startTime, startDate), 
        lte(timeEntries.startTime, endDate),
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false)
      ));

    const totalHours = totalHoursResult[0]?.totalSeconds || 0;
    const completedTasks = completedTasksResult[0]?.count || 0;
    const activeProjects = activeProjectsResult[0]?.count || 0;

    return new Response(JSON.stringify({
      totalHours,
      completedTasks,
      activeProjects,
      period: 'This Week',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
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