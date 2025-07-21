import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { taskAssignments } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { taskId, userIds } = body;

    if (!taskId || !userIds || !Array.isArray(userIds)) {
      return new Response(JSON.stringify({ error: 'Task ID and user IDs array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First, remove all existing assignments for this task
    await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.taskId, parseInt(taskId)));

    // Then, add new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map(userId => ({
        taskId: parseInt(taskId),
        userId: parseInt(userId),
      }));

      await db.insert(taskAssignments).values(assignments);
    }

    return new Response(JSON.stringify({ message: 'Task assignments updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating task assignments:', error);
    return new Response(JSON.stringify({ error: 'Failed to update task assignments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 