import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { tasks, taskAssignments, users, timeEntries } from '../../../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all tasks for the project with their assignments and time data
    const projectTasks = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        name: tasks.name,
        description: tasks.description,
        status: tasks.status,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.durationManual})/3600, 0)`,
        assignedUsers: sql<string>`STRING_AGG(DISTINCT ${users.name}, ', ')`,
        assignedUserIds: sql<string>`STRING_AGG(DISTINCT ${users.id}::text, ', ')`,
      })
      .from(tasks)
      .leftJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .leftJoin(users, eq(taskAssignments.userId, users.id))
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .where(eq(tasks.projectId, parseInt(projectId)))
      .groupBy(tasks.id)
      .orderBy(tasks.createdAt);

    return new Response(JSON.stringify(projectTasks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch project tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 