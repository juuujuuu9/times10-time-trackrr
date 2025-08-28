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

    // Build filter conditions for non-archived activities - include both startTime-based entries and manual entries
    let filterConditions = [
      sql`(
        (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
        OR 
        (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
      )`,
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

    // Get total cost for the week (only non-archived activities)
    const totalCostResult = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
            ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
          END
        ), 0)`.as('total_cost')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(dateFilter);

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

    // Get team members count
    const teamMembersResult = await db
      .select({
        count: count()
      })
      .from(users)
      .where(sql`${users.status} = 'active'`);

    const totalHours = totalHoursResult[0]?.totalSeconds || 0;
    const totalCost = totalCostResult[0]?.totalCost || 0;
    const activeProjects = activeProjectsResult[0]?.count || 0;
    const teamMembers = teamMembersResult[0]?.count || 0;

    return new Response(JSON.stringify({
      totalHours,
      totalCost,
      activeProjects,
      teamMembers,
      period: 'Last 7 Days',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team stats:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch team stats'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 