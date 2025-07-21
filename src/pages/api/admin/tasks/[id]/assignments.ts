import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { taskAssignments, users } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  try {
    const taskId = params.id;
    
    if (!taskId) {
      return new Response(JSON.stringify({ error: 'Task ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all assignments for the task with user info
    const assignments = await db
      .select({
        taskId: taskAssignments.taskId,
        userId: taskAssignments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(taskAssignments)
      .leftJoin(users, eq(taskAssignments.userId, users.id))
      .where(eq(taskAssignments.taskId, parseInt(taskId)));

    return new Response(JSON.stringify(assignments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching task assignments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch task assignments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 