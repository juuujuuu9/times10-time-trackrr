import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { userTaskLists } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth({ request } as any, '/');
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's task list
    const taskList = await db
      .select({
        taskId: userTaskLists.taskId,
        createdAt: userTaskLists.createdAt
      })
      .from(userTaskLists)
      .where(eq(userTaskLists.userId, user.id))
      .orderBy(userTaskLists.createdAt);

    return new Response(JSON.stringify({
      success: true,
      data: taskList.map(item => item.taskId)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user task list:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth({ request } as any, '/');
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId || typeof taskId !== 'number') {
      return new Response(JSON.stringify({ success: false, error: 'Task ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if task is already in user's list
    const existingEntry = await db
      .select()
      .from(userTaskLists)
      .where(and(
        eq(userTaskLists.userId, user.id),
        eq(userTaskLists.taskId, taskId)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'Task already in list' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add task to user's list
    await db.insert(userTaskLists).values({
      userId: user.id,
      taskId: taskId
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding task to user list:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth({ request } as any, '/');
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId || typeof taskId !== 'number') {
      return new Response(JSON.stringify({ success: false, error: 'Task ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove task from user's list
    await db
      .delete(userTaskLists)
      .where(and(
        eq(userTaskLists.userId, user.id),
        eq(userTaskLists.taskId, taskId)
      ));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error removing task from user list:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
