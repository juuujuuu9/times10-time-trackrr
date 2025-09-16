import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
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

    // Get all time entries for the user in the current week with detailed information
    const detailedEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        // Calculate duration in seconds
        calculatedDuration: sql<number>`CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END`.as('calculated_duration'),
        // Get day of week
        dayOfWeek: sql<number>`EXTRACT(DOW FROM COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}))`.as('day_of_week')
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
      .orderBy(timeEntries.createdAt);

    // Group entries by day of week for easier analysis
    const entriesByDay: { [key: number]: any[] } = {};
    detailedEntries.forEach(entry => {
      const day = parseInt(entry.dayOfWeek.toString());
      if (!entriesByDay[day]) {
        entriesByDay[day] = [];
      }
      entriesByDay[day].push(entry);
    });

    // Calculate totals by day
    const dayTotals: { [key: number]: number } = {};
    Object.keys(entriesByDay).forEach(dayStr => {
      const day = parseInt(dayStr);
      const totalSeconds = entriesByDay[day].reduce((sum, entry) => {
        return sum + parseInt(entry.calculatedDuration.toString());
      }, 0);
      dayTotals[day] = totalSeconds;
    });

    return new Response(JSON.stringify({
      userId,
      weekRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      entriesByDay,
      dayTotals,
      allEntries: detailedEntries,
      summary: {
        totalEntries: detailedEntries.length,
        totalSeconds: detailedEntries.reduce((sum, entry) => sum + parseInt(entry.calculatedDuration.toString()), 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching debug time entries:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch debug time entries',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
