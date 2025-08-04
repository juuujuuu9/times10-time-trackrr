import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { timeEntries, users, tasks, projects, clients } from '../../db/schema';
import { count, sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Test basic counts
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalProjects = await db.select({ count: count() }).from(projects);
    const totalTasks = await db.select({ count: count() }).from(tasks);
    const totalTimeEntries = await db.select({ count: count() }).from(timeEntries);

    // Test time entries with duration
    const timeEntriesWithDuration = await db
      .select({
        id: timeEntries.id,
        taskId: timeEntries.taskId,
        userId: timeEntries.userId,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
      })
      .from(timeEntries)
      .where(sql`${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.durationManual} > 0`)
      .limit(5);

    // Test simple project query
    const projectsWithTasks = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        taskCount: count(tasks.id),
      })
      .from(projects)
      .leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`)
      .groupBy(projects.id, projects.name)
      .limit(5);

    // Test simple hours by project query
    const hoursByProject = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.durationManual})/3600.0, 0)`,
      })
      .from(projects)
      .leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`)
      .leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`)
      .groupBy(projects.id, projects.name)
      .having(sql`COALESCE(SUM(${timeEntries.durationManual}), 0) > 0`)
      .limit(5);

    return new Response(JSON.stringify({
      counts: {
        users: totalUsers[0]?.count || 0,
        projects: totalProjects[0]?.count || 0,
        tasks: totalTasks[0]?.count || 0,
        timeEntries: totalTimeEntries[0]?.count || 0,
      },
      timeEntriesWithDuration: timeEntriesWithDuration,
      projectsWithTasks: projectsWithTasks,
      hoursByProject: hoursByProject,
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in test-reports:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 