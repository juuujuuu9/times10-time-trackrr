import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { taskAssignments, taskDiscussions, users } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../utils/session';

export const prerender = false;

// RULE-001: Cascading removal function - removes user from all subtasks when removed from task
async function cascadeRemoveUserFromTask(userId: number, taskId: number) {
  console.log(`Cascading removal: Removing user ${userId} from task ${taskId} and all related subtasks`);
  
  try {
    // Get user name for subtask removal
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      console.log('User not found, skipping subtask removal');
      return { subtasksUpdated: 0 };
    }
    
    // Remove user from all subtasks in this task
    let subtasksUpdated = 0;
    
    // Get all subtask discussions for this task
    const subtaskDiscussions = await db.query.taskDiscussions.findMany({
      where: and(
        eq(taskDiscussions.taskId, taskId),
        eq(taskDiscussions.type, 'subtask')
      )
    });
    
    for (const discussion of subtaskDiscussions) {
      if (discussion.subtaskData) {
        try {
          const subtaskData = JSON.parse(discussion.subtaskData);
          if (subtaskData.subtasks && Array.isArray(subtaskData.subtasks)) {
            let updated = false;
            
            // Remove user from all subtasks in this discussion
            subtaskData.subtasks.forEach((subtask: any) => {
              if (subtask.assignees && Array.isArray(subtask.assignees)) {
                if (subtask.assignees.includes(user.name)) {
                  subtask.assignees = subtask.assignees.filter((assignee: string) => assignee !== user.name);
                  updated = true;
                }
              }
            });
            
            if (updated) {
              // Update the discussion with modified subtask data
              await db
                .update(taskDiscussions)
                .set({ 
                  subtaskData: JSON.stringify(subtaskData),
                  updatedAt: new Date()
                })
                .where(eq(taskDiscussions.id, discussion.id));
              
              subtasksUpdated++;
            }
          }
        } catch (parseError) {
          console.error('Error parsing subtask data for discussion:', discussion.id, parseError);
        }
      }
    }
    
    console.log(`Updated ${subtasksUpdated} subtask discussions`);
    
    return { subtasksUpdated: subtasksUpdated };
    
  } catch (error) {
    console.error('Error in cascading removal from task:', error);
    throw error;
  }
}

export const DELETE: APIRoute = async (context) => {
  try {
    console.log('DELETE task assignment API called');
    
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

    const { id } = context.params;
    const body = await context.request.json();
    const { userId } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Valid userId is required' 
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

    // RULE-001: Cascading removal - remove user from all subtasks when removed from task
    try {
      const cascadeResult = await cascadeRemoveUserFromTask(userId, taskId);
      console.log(`Cascading removal completed for user ${userId} from task ${taskId}:`, cascadeResult);
    } catch (cascadeError) {
      console.error(`Error in cascading removal for user ${userId} from task ${taskId}:`, cascadeError);
      // Continue with task assignment removal even if cascading fails
    }

    // Remove the task assignment
    const removedAssignment = await db
      .delete(taskAssignments)
      .where(
        and(
          eq(taskAssignments.taskId, taskId),
          eq(taskAssignments.userId, userId)
        )
      )
      .returning();

    if (removedAssignment.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task assignment not found',
        error: 'User is not assigned to this task'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User removed from task and all subtasks successfully',
      data: {
        taskId: taskId,
        userId: userId,
        removedAt: new Date()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error removing task assignment:', error);
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
