import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { timeEntries, users, tasks, projects, clients } from '../../../../db/schema';
import { count, sql, sum } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const viewType = searchParams.get('viewType') || 'hours'; // 'hours', 'cost', or 'team'
    const includeTrends = searchParams.get('includeTrends') === 'true';

    // Default to current week (Sunday to Saturday) if no dates provided
    let startDateParam = '';
    let endDateParam = '';

    if (startDate && endDate) {
      startDateParam = startDate;
      endDateParam = endDate;
    } else {
      // Get current week (Sunday to Saturday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const daysFromSunday = currentDay;
      const daysToSaturday = 6 - currentDay;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysFromSunday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysToSaturday);
      endOfWeek.setHours(23, 59, 59, 999);
      
      startDateParam = startOfWeek.toISOString();
      endDateParam = endOfWeek.toISOString();
    }

    let result;
    let trendData: Array<{ date: string; hours: number; cost: number }> = [];
    let workloadData: Array<{ userId: number; userName: string; totalHours: number; totalCost: number }> = [];

    if (viewType === 'cost') {
      // Get cost by project
      result = await db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          clientName: sql<string>`COALESCE(${clients.name}, 'Unknown Client')`,
          totalCost: sql<number>`CAST(COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0) AS DECIMAL(10,2))`,
          totalHours: sql<number>`CAST(COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) AS DECIMAL(10,2))`,
        })
        .from(projects)
        .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
        .leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`)
        .leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`)
        .leftJoin(users, sql`${timeEntries.userId} = ${users.id}`)
        .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${startDateParam} AND ${timeEntries.createdAt} <= ${endDateParam}`)
        .groupBy(projects.id, projects.name, clients.name)
        .having(sql`COALESCE(SUM(${timeEntries.durationManual}), 0) > 0`)
        .orderBy(sql`COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0) DESC`);
    } else if (viewType === 'team') {
      // Get hours by team member
      result = await db
        .select({
          userId: users.id,
          userName: users.name,
          totalHours: sql<number>`CAST(COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) AS DECIMAL(10,2))`,
          totalCost: sql<number>`CAST(COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0) AS DECIMAL(10,2))`,
        })
        .from(users)
        .leftJoin(timeEntries, sql`${users.id} = ${timeEntries.userId}`)
        .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${startDateParam} AND ${timeEntries.createdAt} <= ${endDateParam}`)
        .groupBy(users.id, users.name)
        .having(sql`COALESCE(SUM(${timeEntries.durationManual}), 0) > 0`)
        .orderBy(sql`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) DESC`);
    } else {
      // Get hours by project
      result = await db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          clientName: sql<string>`COALESCE(${clients.name}, 'Unknown Client')`,
          totalHours: sql<number>`CAST(COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) AS DECIMAL(10,2))`,
        })
        .from(projects)
        .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
        .leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`)
        .leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`)
        .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${startDateParam} AND ${timeEntries.createdAt} <= ${endDateParam}`)
        .groupBy(projects.id, projects.name, clients.name)
        .having(sql`COALESCE(SUM(${timeEntries.durationManual}), 0) > 0`)
        .orderBy(sql`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) DESC`);
    }

    // Get total hours and cost for the period
    const totalStats = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0)`,
        totalCost: sql<number>`COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0)`,
      })
      .from(timeEntries)
      .leftJoin(users, sql`${timeEntries.userId} = ${users.id}`)
      .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${startDateParam} AND ${timeEntries.createdAt} <= ${endDateParam}`);

    // Get trend data for the last 7 days if requested
    if (includeTrends) {
      const trendStartDate = new Date();
      trendStartDate.setDate(trendStartDate.getDate() - 6);
      trendStartDate.setHours(0, 0, 0, 0);

      const trendResult = await db
        .select({
          date: sql<string>`DATE(${timeEntries.createdAt})`,
          hours: sql<number>`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0)`,
          cost: sql<number>`COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0)`,
        })
        .from(timeEntries)
        .leftJoin(users, sql`${timeEntries.userId} = ${users.id}`)
        .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${trendStartDate.toISOString()}`)
        .groupBy(sql`DATE(${timeEntries.createdAt})`)
        .orderBy(sql`DATE(${timeEntries.createdAt})`);

      trendData = trendResult;
    }

    // Get workload data for all team members
    const workloadResult = await db
      .select({
        userId: users.id,
        userName: users.name,
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0)`,
        totalCost: sql<number>`COALESCE(SUM((${timeEntries.durationManual}/3600.0) * CAST(${users.payRate} AS DECIMAL(10,2))), 0)`,
      })
      .from(users)
      .leftJoin(timeEntries, sql`${users.id} = ${timeEntries.userId}`)
      .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0 AND ${timeEntries.createdAt} >= ${startDateParam} AND ${timeEntries.createdAt} <= ${endDateParam}`)
      .groupBy(users.id, users.name)
      .orderBy(sql`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0) DESC`);

    workloadData = workloadResult;

    return new Response(JSON.stringify({
      success: true,
      data: result,
      totals: {
        totalHours: totalStats[0]?.totalHours || 0,
        totalCost: totalStats[0]?.totalCost || 0,
      },
      trendData,
      workloadData,
      dateRange: {
        startDate: startDateParam,
        endDate: endDateParam,
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch report data',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 