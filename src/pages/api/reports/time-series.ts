import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users } from '../../../db/schema';
import { sql, gte, lte, and } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
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
      case 'last7':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last14':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
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
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
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
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    // Build filter conditions
    let filterConditions = [gte(timeEntries.startTime, startDate), lte(timeEntries.startTime, endDate)];

    if (teamMemberId && teamMemberId !== 'all') {
      filterConditions.push(sql`${timeEntries.userId} = ${parseInt(teamMemberId)}`);
    }

    if (projectId) {
      filterConditions.push(sql`${timeEntries.taskId} IN (
        SELECT id FROM tasks WHERE project_id = ${parseInt(projectId)}
      )`);
    }

    if (clientId) {
      filterConditions.push(sql`${timeEntries.taskId} IN (
        SELECT t.id FROM tasks t 
        INNER JOIN projects p ON t.project_id = p.id 
        WHERE p.client_id = ${parseInt(clientId)}
      )`);
    }

    const dateFilter = and(...filterConditions);

    // Get daily time series data
    const timeSeriesResult = await db
      .select({
        date: sql<string>`DATE(${timeEntries.startTime})`,
        totalSeconds: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
            ELSE COALESCE(${timeEntries.durationManual}, 0)
          END
        ), 0)`.as('total_seconds'),
        totalCost: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
            ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
          END
        ), 0)`.as('total_cost')
      })
      .from(timeEntries)
      .innerJoin(users, sql`${timeEntries.userId} = ${users.id}`)
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
        cost: existingData?.totalCost || 0
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
