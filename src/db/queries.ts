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
      taskId: timeEntries.taskId,
      userName: users.name,
      userPayRate: users.payRate,
      taskName: tasks.name,
      projectName: projects.name,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        gte(timeEntries.startTime, weekStart),
        lte(timeEntries.startTime, weekEnd)
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
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_seconds')
    })
    .from(timeEntries)
    .where(
      and(
        gte(timeEntries.startTime, weekStart),
        lte(timeEntries.startTime, weekEnd)
      )
    );

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
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .where(
      and(
        gte(timeEntries.startTime, weekStart),
        lte(timeEntries.startTime, weekEnd)
      )
    );

  // Get active team members for the week
  const activeTeamMembersResult = await db
    .select({
      count: count(sql`DISTINCT ${timeEntries.userId}`)
    })
    .from(timeEntries)
    .where(
      and(
        gte(timeEntries.startTime, weekStart),
        lte(timeEntries.startTime, weekEnd)
      )
    );

  return {
    totalHours: totalHoursResult[0]?.totalSeconds || 0,
    totalCost: totalCostResult[0]?.totalCost || 0,
    activeTeamMembers: activeTeamMembersResult[0]?.count || 0,
  };
}

// Get project costs for a specific time period
export async function getProjectCosts(startDate: Date, endDate: Date, teamMemberId?: number) {
  return await db
    .select({
      projectId: projects.id,
      clientId: clients.id,
      projectName: projects.name,
      clientName: clients.name,
      totalCost: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
          ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
        END
      ), 0)`.as('total_cost'),
      totalHours: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_hours')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      teamMemberId 
        ? and(
            gte(timeEntries.startTime, startDate),
            lte(timeEntries.startTime, endDate),
            eq(timeEntries.userId, teamMemberId)
          )
        : and(
            gte(timeEntries.startTime, startDate),
            lte(timeEntries.startTime, endDate)
          )
    )
    .groupBy(projects.id, projects.name, clients.id, clients.name)
    .having(sql`COALESCE(SUM(
      CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
        ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
      END
    ), 0) > 0`)
    .orderBy(projects.name);
}

// Get client costs for a specific time period
export async function getClientCosts(startDate: Date, endDate: Date, teamMemberId?: number) {
  return await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      totalCost: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
          ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
        END
      ), 0)`.as('total_cost'),
      totalHours: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE COALESCE(${timeEntries.durationManual}, 0)
        END
      ), 0)`.as('total_hours'),
      projectCount: count(sql`DISTINCT ${projects.id}`).as('project_count')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(
      teamMemberId 
        ? and(
            gte(timeEntries.startTime, startDate),
            lte(timeEntries.startTime, endDate),
            eq(timeEntries.userId, teamMemberId)
          )
        : and(
            gte(timeEntries.startTime, startDate),
            lte(timeEntries.startTime, endDate)
          )
    )
    .groupBy(clients.id, clients.name)
    .having(sql`COALESCE(SUM(
      CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
        ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
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