import type { APIRoute } from 'astro';
import { db } from '../../../../../db/index';
import { taskAssignments, taskDiscussions, users, tasks, teams, teamMembers } from '../../../../../db/schema';
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
    console.log('DELETE collaboration task assignment API called');
    
    // Get current user
    const currentUser = await getSessionUser(context);
    
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = context.params;
    const body = await context.request.json();
    const { userId, taskId } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Collaboration ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!taskId || typeof taskId !== 'number' || isNaN(taskId)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Valid taskId is required' 
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

    const collaborationId = parseInt(id);
    
    if (isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid collaboration ID format',
        error: 'Collaboration ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if current user is a member of the collaboration
    const collaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId),
      with: {
        members: {
          with: {
            user: true
          }
        }
      }
    });

    if (!collaboration) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Collaboration not found',
        error: 'Collaboration does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if current user is a member of this collaboration
    const isCurrentUserMember = collaboration.members.some(
      (member: any) => member.userId === currentUser.id
    );
    
    if (!isCurrentUserMember) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Access denied',
        error: 'You are not a member of this collaboration'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the task exists and check if it's associated with this collaboration
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        project: true
      }
    });

    if (!task) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if task belongs to this collaboration either by:
    // 1. Direct teamId association, or
    // 2. Project association (if the collaboration's project matches the task's project)
    const isTaskInCollaboration = task.teamId === collaborationId || 
      (collaboration.projectId && task.projectId === collaboration.projectId);

    if (!isTaskInCollaboration) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist in this collaboration'
      }), {
        status: 404,
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
        collaborationId: collaborationId,
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
