import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks } from '../../../db/schema';
import { sql, count, gte, lte, and } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    // Calculate date range for this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Build filter conditions
    let filterConditions = [gte(timeEntries.startTime, startDate), lte(timeEntries.startTime, endDate)];
    
    if (userId) {
      filterConditions.push(sql`${timeEntries.userId} = ${parseInt(userId)}`);
    }

    const dateFilter = and(...filterConditions);

    // Get total hours for the week
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
      .where(dateFilter);

    // Get total cost for the week
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
      .innerJoin(users, sql`${timeEntries.userId} = ${users.id}`)
      .where(dateFilter);

    // Get active projects count
    const activeProjectsResult = await db
      .select({
        count: count(sql`DISTINCT ${projects.id}`)
      })
      .from(timeEntries)
      .innerJoin(tasks, sql`${timeEntries.taskId} = ${tasks.id}`)
      .innerJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .where(and(dateFilter, sql`${projects.archived} = false`));

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
      period: 'This Week',
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