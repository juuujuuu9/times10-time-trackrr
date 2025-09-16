import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, tasks, projects, clients, taskAssignments } from '../../../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Then get time entries for each task in the date range with SQL-calculated durations and day of week
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

    console.log('Time entries in date range:', timeEntriesData);
    console.log('Time entries count:', timeEntriesData.length);

    // Process the data to calculate daily totals per task
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

    return new Response(JSON.stringify({
      taskDailyData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching task daily totals:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};