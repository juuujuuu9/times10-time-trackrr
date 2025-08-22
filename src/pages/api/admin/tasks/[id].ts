import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { tasks, taskAssignments, timeEntries } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Task ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);

    // First, remove all user assignments from the task
    await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));

    // Note: We intentionally keep time entries for record keeping
    // Time entries will remain in the database but will have a reference to a deleted task

    // Finally, delete the task
    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning();

    if (deletedTask.length === 0) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Task deleted successfully. All user assignments have been removed. Time entries have been preserved for record keeping.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 