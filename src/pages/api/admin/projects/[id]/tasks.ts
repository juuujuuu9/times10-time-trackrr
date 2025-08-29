import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { tasks, taskAssignments, users, timeEntries } from '../../../../../db/schema';
import { eq, sql, and } from 'drizzle-orm';

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

    console.log('Fetching tasks for project ID:', projectId);

    // First, let's try a simple query to get just the tasks
    const projectTasks = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        name: tasks.name,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        isSystem: tasks.isSystem,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(and(
        eq(tasks.projectId, parseInt(projectId)),
        eq(tasks.isSystem, false) // Exclude system-generated tasks
      ))
      .orderBy(tasks.createdAt);

    console.log('Found tasks:', projectTasks.length);

    // Now let's enhance each task with additional data
    const enhancedTasks = await Promise.all(
      projectTasks.map(async (task) => {
        // Get time entries for this task
        const taskTimeEntries = await db
          .select({
            durationManual: timeEntries.durationManual,
          })
          .from(timeEntries)
          .where(eq(timeEntries.taskId, task.id));

        // Calculate total hours
        const totalHours = taskTimeEntries.reduce((sum, entry) => {
          return sum + (entry.durationManual ? entry.durationManual / 3600 : 0);
        }, 0);

        // Get assigned users for this task
        const taskAssignmentData = await db
          .select({
            userName: users.name,
          })
          .from(taskAssignments)
          .leftJoin(users, eq(taskAssignments.userId, users.id))
          .where(eq(taskAssignments.taskId, task.id));

        const assignedUsers = taskAssignmentData
          .map(assignment => assignment.userName)
          .filter(name => name !== null)
          .join(', ');

        return {
          ...task,
          totalHours,
          assignedUsers: assignedUsers || null,
        };
      })
    );

    console.log('Enhanced tasks:', enhancedTasks.length);

    return new Response(JSON.stringify(enhancedTasks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch project tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 