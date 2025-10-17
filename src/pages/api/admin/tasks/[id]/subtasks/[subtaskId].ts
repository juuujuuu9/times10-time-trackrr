import type { APIRoute } from 'astro';
import { db } from '../../../../../../db/index';
import { taskDiscussions, taskAssignments, users, tasks, projects } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';
import { sendSubtaskAssignmentEmail } from '../../../../../../utils/email';
import { getEmailBaseUrl } from '../../../../../../utils/url';

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

    // Parse taskId first before using it
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

    // RULE-001: Enforce hierarchical permissions - only task assignees can be assigned to subtasks
    if (assignees && Array.isArray(assignees)) {
      console.log('Validating subtask assignees against task assignees');
      
      // Get all users assigned to this task
      const taskAssignmentsList = await db.query.taskAssignments.findMany({
        where: eq(taskAssignments.taskId, taskId),
        with: {
          user: true
        }
      });

      const taskAssigneeNames = taskAssignmentsList.map(assignment => assignment.user.name);
      const invalidAssignees = assignees.filter(assignee => !taskAssigneeNames.includes(assignee));
      
      if (invalidAssignees.length > 0) {
        console.log('Invalid subtask assignees not assigned to parent task:', invalidAssignees);
        return new Response(JSON.stringify({
          success: false,
          error: 'Only users assigned to the parent task can be assigned to subtasks. Invalid assignees: ' + invalidAssignees.join(', '),
          invalidAssignees: invalidAssignees,
          validAssignees: taskAssigneeNames
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      console.log('All subtask assignees are valid task assignees');
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

    // Send email notifications for newly assigned users (if assignees were updated)
    if (assignees && Array.isArray(assignees)) {
      try {
        // Get task and project information for email notifications
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
          with: {
            project: true
          }
        });

        if (task && task.project) {
          // Get base URL for dashboard link
          const baseUrl = getEmailBaseUrl();
          const dashboardUrl = `${baseUrl}/admin/collaborations/${task.teamId || 'general'}`;

          // Send emails to newly assigned users
          for (const assigneeName of assignees) {
            // Find user by name
            const user = await db.query.users.findFirst({
              where: eq(users.name, assigneeName)
            });

            if (user && user.email && user.id !== currentUser.id) {
              console.log(`📧 Attempting to send subtask assignment email to ${user.email}`);
              await sendSubtaskAssignmentEmail({
                email: user.email,
                userName: user.name,
                subtaskName: targetSubtask.title || 'Untitled Subtask',
                taskName: task.name,
                projectName: task.project.name,
                assignedBy: currentUser.name,
                subtaskDescription: targetSubtask.description || undefined,
                dashboardUrl: dashboardUrl,
              });
              console.log(`📧 Subtask assignment email sent to ${user.email}`);
            } else {
              console.log(`📧 Skipping email for user ${assigneeName} (same user or no email)`);
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending subtask assignment notifications:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

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

export const DELETE: APIRoute = async (context) => {
  try {
    console.log('DELETE subtask API called');
    
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

    // Remove the subtask from the subtask data
    const subtaskData = JSON.parse(targetDiscussion.subtaskData);
    subtaskData.subtasks.splice(subtaskIndex, 1);

    // If no subtasks remain, delete the entire discussion
    if (subtaskData.subtasks.length === 0) {
      await db
        .delete(taskDiscussions)
        .where(eq(taskDiscussions.id, targetDiscussion.id));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Subtask deleted successfully. Discussion removed as no subtasks remain.',
        data: {
          subtaskId: subtaskIdStr,
          deletedAt: new Date(),
          discussionDeleted: true
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
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
        message: 'Subtask deleted successfully',
        data: {
          subtaskId: subtaskIdStr,
          deletedAt: new Date(),
          remainingSubtasks: subtaskData.subtasks.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error deleting subtask:', error);
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
