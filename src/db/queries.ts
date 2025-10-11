import { db } from './index';
import { users, timeEntries, tasks, projects, clients } from './schema';
import { eq, and, gte, lte, sql, sum, count, inArray } from 'drizzle-orm';
import { getWeekStartDate, getWeekEndDate } from '../utils/dateUtils';

// Get all active users
export async function getActiveUsers() {
  return await db
    .select()
    .from(users)
    .orderBy(users.name);
}

// Get all users (active and inactive)
export async function getAllUsers() {
  return await db
    .select()
    .from(users)
    .orderBy(users.name);
}

// Get weekly time entries with user and task information
export async function getWeeklyTimeEntries() {
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();
  
  return await db
    .select({
      id: timeEntries.id,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      durationManual: timeEntries.durationManual,
      notes: timeEntries.notes,
      userId: timeEntries.userId,
      projectId: timeEntries.projectId,
      userName: users.name,
      userPayRate: users.payRate,
      projectName: projects.name,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${weekStart} AND ${timeEntries.startTime} <= ${weekEnd})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${weekStart} AND ${timeEntries.createdAt} <= ${weekEnd})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      )
    )
    .orderBy(timeEntries.startTime);
}

// Get weekly totals
export async function getWeeklyTotals() {
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();
  
  // Get total hours for the week
  const totalHoursResult = await db
    .select({
      totalSeconds: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_seconds')
    })
    .from(timeEntries)
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${weekStart} AND ${timeEntries.startTime} <= ${weekEnd})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${weekStart} AND ${timeEntries.createdAt} <= ${weekEnd})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      )
    );

  // Get total cost for the week
  const totalCostResult = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN ROUND((ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
          ELSE ROUND((COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
        END
      ), 0)`.as('total_cost')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${weekStart} AND ${timeEntries.startTime} <= ${weekEnd})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${weekStart} AND ${timeEntries.createdAt} <= ${weekEnd})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      )
    );

  // Get active team members for the week
  const activeTeamMembersResult = await db
    .select({
      count: count(sql`DISTINCT ${timeEntries.userId}`)
    })
    .from(timeEntries)
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(
        sql`(
          (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${weekStart} AND ${timeEntries.startTime} <= ${weekEnd})
          OR 
          (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${weekStart} AND ${timeEntries.createdAt} <= ${weekEnd})
        )`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        // Exclude ongoing timers (entries with startTime but no endTime)
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL)`
      )
    );

  return {
    totalHours: totalHoursResult[0]?.totalSeconds || 0,
    totalCost: totalCostResult[0]?.totalCost || 0,
    activeTeamMembers: activeTeamMembersResult[0]?.count || 0,
  };
}

// Get project costs for a specific time period
export async function getProjectCosts(startDate: Date, endDate: Date, teamMemberId?: number, canViewFinancialData: boolean = true) {
  // Handle "All Time" case with a more reliable date range
  const actualStartDate = startDate.getTime() === 0 ? new Date('1900-01-01') : startDate;
  return await db
    .select({
      projectId: projects.id,
      clientId: clients.id,
      projectName: projects.name,
      clientName: clients.name,
      totalCost: canViewFinancialData 
        ? sql<number>`COALESCE(SUM(
            CASE 
              WHEN ${timeEntries.endTime} IS NOT NULL 
              THEN ROUND((ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
              ELSE ROUND((COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
            END
          ), 0)`.as('total_cost')
        : sql<number>`0`.as('total_cost'),
      totalHours: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_hours')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      teamMemberId 
        ? and(
            sql`(
              (${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${actualStartDate} AND ${timeEntries.createdAt} <= ${endDate})
              OR 
              (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NOT NULL AND ${timeEntries.durationManual} IS NULL AND ${timeEntries.startTime} >= ${actualStartDate} AND ${timeEntries.startTime} <= ${endDate})
            )`,
            eq(timeEntries.userId, teamMemberId),
            eq(clients.archived, false),
            eq(projects.archived, false),
            // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
            sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
          )
        : and(
            sql`(
              (${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${actualStartDate} AND ${timeEntries.createdAt} <= ${endDate})
              OR 
              (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NOT NULL AND ${timeEntries.durationManual} IS NULL AND ${timeEntries.startTime} >= ${actualStartDate} AND ${timeEntries.startTime} <= ${endDate})
            )`,
            eq(clients.archived, false),
            eq(projects.archived, false),
            // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
            sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
          )
    )
    .groupBy(projects.id, projects.name, clients.id, clients.name)
    .having(sql`COALESCE(SUM(
      CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
        ELSE COALESCE(${timeEntries.durationManual}, 0)
      END
    ), 0) > 0`)
    .orderBy(clients.name, projects.name);
}

// Get client costs for a specific time period
export async function getClientCosts(startDate: Date, endDate: Date, teamMemberId?: number, canViewFinancialData: boolean = true) {
  // Handle "All Time" case with a more reliable date range
  const actualStartDate = startDate.getTime() === 0 ? new Date('1900-01-01') : startDate;
  return await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      totalCost: canViewFinancialData 
        ? sql<number>`COALESCE(SUM(
            CASE 
              WHEN ${timeEntries.endTime} IS NOT NULL 
              THEN ROUND((ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
              ELSE ROUND((COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
            END
          ), 0)`.as('total_cost')
        : sql<number>`0`.as('total_cost'),
      totalHours: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_hours'),
      projectCount: count(sql`DISTINCT ${projects.id}`).as('project_count')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      teamMemberId 
        ? and(
            sql`(
              (${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${actualStartDate} AND ${timeEntries.createdAt} <= ${endDate})
              OR 
              (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NOT NULL AND ${timeEntries.durationManual} IS NULL AND ${timeEntries.startTime} >= ${actualStartDate} AND ${timeEntries.startTime} <= ${endDate})
            )`,
            eq(timeEntries.userId, teamMemberId),
            eq(clients.archived, false),
            eq(projects.archived, false),
            // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
            sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
          )
        : and(
            sql`(
              (${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${actualStartDate} AND ${timeEntries.createdAt} <= ${endDate})
              OR 
              (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NOT NULL AND ${timeEntries.durationManual} IS NULL AND ${timeEntries.startTime} >= ${actualStartDate} AND ${timeEntries.startTime} <= ${endDate})
            )`,
            eq(clients.archived, false),
            eq(projects.archived, false),
            // Exclude ongoing timers (entries with startTime but no endTime AND no durationManual)
            sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
          )
    )
    .groupBy(clients.id, clients.name)
    .having(sql`COALESCE(SUM(
      CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN ROUND(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))::numeric, 0)
        ELSE COALESCE(${timeEntries.durationManual}, 0)
      END
    ), 0) > 0`)
    .orderBy(clients.name);
} 

// Get user by ID
export async function getUserById(userId: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return result[0] || null;
}

// Get task with project information by ID
export async function getTaskWithProject(taskId: number) {
  const result = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      description: tasks.description,
      status: tasks.status,
      projectId: tasks.projectId,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  
  return result[0] || null;
}

// Get users by IDs
export async function getUsersByIds(userIds: number[]) {
  if (userIds.length === 0) return [];
  
  return await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));
} 