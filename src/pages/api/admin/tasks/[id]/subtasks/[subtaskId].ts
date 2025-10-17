import type { APIRoute } from 'astro';
import { db } from '../../../../../../db/index';
import { taskDiscussions } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    console.log('PUT subtask API called');
    
    // Get current user and verify admin access
    const currentUser = await getSessionUser(context);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Insufficient permissions'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id, subtaskId } = context.params;
    const body = await context.request.json();
    const { completed, assignees } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!subtaskId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Subtask ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof completed !== 'boolean' && !assignees) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Either completed status (boolean) or assignees (array) is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid task ID format',
        error: 'Task ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Subtask ID can be a string (like 'temp-1760589411117-0')
    const subtaskIdStr = subtaskId;

    // Find the task discussion that contains this subtask
    const taskDiscussionsList = await db.query.taskDiscussions.findMany({
      where: and(
        eq(taskDiscussions.taskId, taskId),
        eq(taskDiscussions.type, 'subtask')
      )
    });

    if (taskDiscussionsList.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No subtasks found for this task',
        error: 'Task has no subtasks'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the specific subtask in the subtaskData
    let targetDiscussion = null;
    let targetSubtask = null;
    let subtaskIndex = -1;

    for (const discussion of taskDiscussionsList) {
      if (discussion.subtaskData) {
        try {
          const subtaskData = JSON.parse(discussion.subtaskData);
          if (subtaskData.subtasks && Array.isArray(subtaskData.subtasks)) {
            const foundIndex = subtaskData.subtasks.findIndex((subtask: any) => subtask.id === subtaskIdStr);
            if (foundIndex !== -1) {
              targetDiscussion = discussion;
              targetSubtask = subtaskData.subtasks[foundIndex];
              subtaskIndex = foundIndex;
              break;
            }
          }
        } catch (parseError) {
          console.error('Error parsing subtask data for discussion:', discussion.id, parseError);
        }
      }
    }

    if (!targetDiscussion || !targetSubtask) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Subtask not found',
        error: 'Subtask does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the subtask data
    const subtaskData = JSON.parse(targetDiscussion.subtaskData);
    if (typeof completed === 'boolean') {
      subtaskData.subtasks[subtaskIndex].completed = completed;
    }
    if (assignees) {
      subtaskData.subtasks[subtaskIndex].assignees = assignees;
    }

    // Update the discussion with the modified subtask data
    const updatedDiscussion = await db
      .update(taskDiscussions)
      .set({ 
        subtaskData: JSON.stringify(subtaskData),
        updatedAt: new Date()
      })
      .where(eq(taskDiscussions.id, targetDiscussion.id))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      message: 'Subtask updated successfully',
      data: {
        subtaskId: subtaskIdStr,
        completed: completed,
        assignees: assignees,
        updatedAt: new Date()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating subtask completion:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
