import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, tasks, projects, clients, taskAssignments } from '../../../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const startParam = url.searchParams.get('startDate');
    const endParam = url.searchParams.get('endDate');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // First, get all tasks for the user
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

    console.log('All tasks for user:', allTasks);

    // Then get time entries for each task in the date range with SQL-calculated durations
    const timeEntriesData = await db
      .select({
        taskId: timeEntries.taskId,
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

    // Calculate day of week in JavaScript using local timezone
    const timeEntriesWithDayOfWeek = timeEntriesData.map(entry => {
      const entryDate = entry.startTime || entry.createdAt;
      if (!entryDate) return { ...entry, dayOfWeek: 0 };
      
      // Convert UTC timestamp to local timezone and get day of week
      const localDate = new Date(entryDate);
      const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
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