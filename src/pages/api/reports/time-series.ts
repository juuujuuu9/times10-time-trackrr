import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
import { sql, gte, lte, and, eq } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Check user session and permissions
    const user = await getSessionUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const canViewFinancialData = user.role === 'admin';
    const searchParams = url.searchParams;
    const period = searchParams.get('period') || 'last30';
    const teamMemberId = searchParams.get('teamMember');
    const projectId = searchParams.get('project');
    const clientId = searchParams.get('client');
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'all':
        // All time - no date filter
        startDate = new Date(0); // Beginning of time
        endDate = new Date(); // Now
        break;
      case 'today':
        // Today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // This week (Sunday to Saturday)
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // This month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        // This quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        // Custom period
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        // Default to this week
        const defaultDayOfWeek = now.getDay();
        const defaultDaysToSubtract = defaultDayOfWeek === 0 ? 0 : defaultDayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - defaultDaysToSubtract);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    }

    // Build filter conditions - use startTime for date filtering (when work was done)
    let filterConditions = [
      // For entries with startTime, use startTime for filtering
      // For entries without startTime (manual entries), use createdAt
      sql`(
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
        OR 
        (${timeEntries.startTime} IS NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
      )`,
      eq(clients.archived, false),
      eq(projects.archived, false),
      eq(tasks.archived, false),
      // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
      sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
    ];

    if (teamMemberId && teamMemberId !== 'all') {
      filterConditions.push(sql`${timeEntries.userId} = ${parseInt(teamMemberId)}`);
    }

    if (projectId) {
      filterConditions.push(sql`${timeEntries.taskId} IN (
        SELECT id FROM tasks WHERE project_id = ${parseInt(projectId)} AND archived = false
      )`);
    }

    if (clientId) {
      filterConditions.push(sql`${timeEntries.taskId} IN (
        SELECT t.id FROM tasks t 
        INNER JOIN projects p ON t.project_id = p.id 
        WHERE p.client_id = ${parseInt(clientId)} AND p.archived = false AND t.archived = false
      )`);
    }

    const dateFilter = and(...filterConditions);

    // Get daily time series data (only non-archived activities)
    const timeSeriesResult = await db
      .select({
        date: sql<string>`DATE(${timeEntries.startTime})`,
        totalSeconds: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
            ELSE COALESCE(${timeEntries.durationManual}, 0)
          END
        ), 0)`.as('total_seconds'),
        totalCost: canViewFinancialData 
          ? sql<number>`COALESCE(SUM(
              CASE 
                WHEN ${timeEntries.endTime} IS NOT NULL 
                THEN ROUND((ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
                ELSE ROUND((COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
              END
            ), 0)`.as('total_cost')
          : sql<number>`0`.as('total_cost')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(dateFilter)
      .groupBy(sql`DATE(${timeEntries.startTime})`)
      .orderBy(sql`DATE(${timeEntries.startTime})`);

    // Generate complete date range with zero values for missing dates
    const timeSeriesData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = timeSeriesResult.find(item => item.date === dateStr);
      
      timeSeriesData.push({
        date: dateStr,
        hours: existingData?.totalSeconds || 0,
        cost: canViewFinancialData ? (existingData?.totalCost || 0) : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return new Response(JSON.stringify({
      timeSeriesData,
      period: period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching time series data:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch time series data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
