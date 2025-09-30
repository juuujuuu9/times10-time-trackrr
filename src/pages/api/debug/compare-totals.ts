import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients, taskAssignments } from '../../../db/schema';
import { sql, and, eq, gte, lte } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate current week (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Sunday, don't subtract any days
    
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    console.log('Debug compare totals:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get daily duration totals (dropdown tab logic)
    const dailyTotals = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}))`.as('day_of_week'),
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
      ))
      .groupBy(sql`EXTRACT(DOW FROM COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}))`);

    // Get task daily totals (list tab logic)
    const allTasks = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(tasks)
      .innerJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(taskAssignments.userId, parseInt(userId)),
          eq(tasks.archived, false),
          eq(projects.archived, false),
          eq(clients.archived, false)
        )
      );

    const timeEntriesData = await db
      .select({
        projectId: timeEntries.projectId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
        calculatedDuration: sql<number>`CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END`.as('calculated_duration'),
        dayOfWeek: sql<number>`EXTRACT(DOW FROM COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}))`.as('day_of_week')
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
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
          eq(tasks.archived, false),
          // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
          sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
        )
      );

    // Process task daily data
    const taskDailyData = allTasks.map(task => {
      const dayTotals = [];
      
      // Create array for each day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      for (let i = 0; i < 7; i++) {
        let totalSeconds = 0;
        
        // Find all time entries for this task on this day of the week
        const taskEntries = timeEntriesData.filter(entry => {
          if (entry.taskId !== task.id) return false;
          
          // Use SQL-calculated day of week to match dropdown tab logic
          const dayOfWeek = parseInt(entry.dayOfWeek.toString());
          return dayOfWeek === i;
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

    // Calculate totals
    const dailyTotalsMap = new Map<number, number>();
    dailyTotals.forEach(day => {
      const dayOfWeek = parseInt(day.dayOfWeek.toString());
      const totalSeconds = parseInt(day.totalSeconds.toString());
      dailyTotalsMap.set(dayOfWeek, totalSeconds);
    });

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

    // Calculate task totals
    const taskTotals = taskDailyData.map(task => {
      const totalSeconds = task.dayTotals.reduce((sum, day) => sum + day.totalSeconds, 0);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      return {
        taskId: task.taskId,
        taskName: task.taskName,
        projectName: task.projectName,
        clientName: task.clientName,
        totalSeconds,
        hours,
        minutes,
        formatted: `${hours}h ${minutes}m`
      };
    });

    // Calculate overall totals
    const dropdownTotal = weekTotals.reduce((sum, day) => sum + day.totalSeconds, 0);
    const listTotal = taskTotals.reduce((sum, task) => sum + task.totalSeconds, 0);

    return new Response(JSON.stringify({
      userId,
      weekRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      dropdownTab: {
        dailyTotals: weekTotals,
        totalSeconds: dropdownTotal,
        totalFormatted: `${Math.floor(dropdownTotal / 3600)}h ${Math.floor((dropdownTotal % 3600) / 60)}m`
      },
      listTab: {
        taskTotals: taskTotals,
        totalSeconds: listTotal,
        totalFormatted: `${Math.floor(listTotal / 3600)}h ${Math.floor((listTotal % 3600) / 60)}m`
      },
      comparison: {
        difference: dropdownTotal - listTotal,
        differenceFormatted: `${Math.floor(Math.abs(dropdownTotal - listTotal) / 60)}m ${Math.abs(dropdownTotal - listTotal) % 60}s`,
        dropdownTotal,
        listTotal
      },
      rawData: {
        dailyTotalsRaw: dailyTotals,
        timeEntriesData: timeEntriesData,
        allTasks: allTasks
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in compare totals debug:', error);
    return new Response(JSON.stringify({
      error: 'Failed to compare totals',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
