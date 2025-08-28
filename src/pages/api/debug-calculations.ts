import type { APIRoute } from 'astro';
import { db } from '../../db';
import { timeEntries, users, projects, tasks, clients } from '../../db/schema';
import { sql, gte, lte, and, eq, isNull } from 'drizzle-orm';

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

    // Calculate date range for last 7 days (to match admin dashboard default)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Get all time entries for this user (including archived activities)
    const allEntries = await db
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
        END`.as('calculated_duration'),
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        clientArchived: clients.archived,
        projectArchived: projects.archived,
        taskArchived: tasks.archived
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(timeEntries.userId, parseInt(userId)))
      .orderBy(timeEntries.startTime);

    // Get ongoing timers for this user
    const ongoingTimers = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        clientArchived: clients.archived,
        projectArchived: projects.archived,
        taskArchived: tasks.archived
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, parseInt(userId)),
        isNull(timeEntries.endTime),
        isNull(timeEntries.durationManual)
      ));

    // Calculate elapsed time for ongoing timers
    const nowDate = new Date();
    const ongoingTimersWithElapsed = ongoingTimers.map(timer => {
      const elapsedSeconds = timer.startTime ? Math.floor((nowDate.getTime() - new Date(timer.startTime).getTime()) / 1000) : 0;
      return {
        ...timer,
        elapsedSeconds,
        elapsedHours: (elapsedSeconds / 3600).toFixed(2)
      };
    });

    // Filter entries for this week
    const weeklyEntries = allEntries.filter(entry => {
      if (entry.startTime) {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startDate && entryDate <= endDate;
      } else if (entry.durationManual) {
        // For manual entries, use createdAt date
        const entryDate = new Date(entry.createdAt);
        return entryDate >= startDate && entryDate <= endDate;
      }
      return false;
    });

    // Calculate totals
    const totalAllEntries = allEntries.reduce((sum, entry) => sum + entry.calculatedDuration, 0);
    const totalWeeklyEntries = weeklyEntries.reduce((sum, entry) => sum + entry.calculatedDuration, 0);
    const totalOngoingTimers = ongoingTimersWithElapsed.reduce((sum, timer) => sum + timer.elapsedSeconds, 0);
    
    // Filter out archived activities
    const nonArchivedEntries = allEntries.filter(entry => 
      !entry.clientArchived && !entry.projectArchived && !entry.taskArchived
    );
    const nonArchivedWeeklyEntries = weeklyEntries.filter(entry => 
      !entry.clientArchived && !entry.projectArchived && !entry.taskArchived
    );
    const nonArchivedOngoingTimers = ongoingTimersWithElapsed.filter(timer => 
      !timer.clientArchived && !timer.projectArchived && !timer.taskArchived
    );

    const totalNonArchivedEntries = nonArchivedEntries.reduce((sum, entry) => sum + entry.calculatedDuration, 0);
    const totalNonArchivedWeeklyEntries = nonArchivedWeeklyEntries.reduce((sum, entry) => sum + entry.calculatedDuration, 0);
    const totalNonArchivedOngoingTimers = nonArchivedOngoingTimers.reduce((sum, timer) => sum + timer.elapsedSeconds, 0);

    return new Response(JSON.stringify({
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      totals: {
        allEntries: {
          count: allEntries.length,
          totalSeconds: totalAllEntries,
          totalHours: (totalAllEntries / 3600).toFixed(2)
        },
        weeklyEntries: {
          count: weeklyEntries.length,
          totalSeconds: totalWeeklyEntries,
          totalHours: (totalWeeklyEntries / 3600).toFixed(2)
        },
        ongoingTimers: {
          count: ongoingTimersWithElapsed.length,
          totalSeconds: totalOngoingTimers,
          totalHours: (totalOngoingTimers / 3600).toFixed(2)
        },
        nonArchivedEntries: {
          count: nonArchivedEntries.length,
          totalSeconds: totalNonArchivedEntries,
          totalHours: (totalNonArchivedEntries / 3600).toFixed(2)
        },
        nonArchivedWeeklyEntries: {
          count: nonArchivedWeeklyEntries.length,
          totalSeconds: totalNonArchivedWeeklyEntries,
          totalHours: (totalNonArchivedWeeklyEntries / 3600).toFixed(2)
        },
        nonArchivedOngoingTimers: {
          count: nonArchivedOngoingTimers.length,
          totalSeconds: totalNonArchivedOngoingTimers,
          totalHours: (totalNonArchivedOngoingTimers / 3600).toFixed(2)
        }
      },
      entries: allEntries.map(entry => ({
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
        durationManual: entry.durationManual,
        calculatedDuration: entry.calculatedDuration,
        durationHours: (entry.calculatedDuration / 3600).toFixed(2),
        taskName: entry.taskName,
        projectName: entry.projectName,
        clientName: entry.clientName,
        isArchived: entry.clientArchived || entry.projectArchived || entry.taskArchived,
        isInWeek: entry.startTime ? 
          (new Date(entry.startTime) >= startDate && new Date(entry.startTime) <= endDate) :
          (entry.durationManual ? (new Date(entry.createdAt) >= startDate && new Date(entry.createdAt) <= endDate) : false)
      })),
      ongoingTimers: ongoingTimersWithElapsed.map(timer => ({
        id: timer.id,
        startTime: timer.startTime,
        elapsedSeconds: timer.elapsedSeconds,
        elapsedHours: timer.elapsedHours,
        taskName: timer.taskName,
        projectName: timer.projectName,
        clientName: timer.clientName,
        isArchived: timer.clientArchived || timer.projectArchived || timer.taskArchived
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in debug calculations:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get debug calculations'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
