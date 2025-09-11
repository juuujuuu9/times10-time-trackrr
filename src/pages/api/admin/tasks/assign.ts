import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { taskAssignments, users, tasks } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendTaskAssignmentEmail } from '../../../../utils/email';
import { getTaskWithProject, getUsersByIds, getUserById } from '../../../../db/queries';
import { getSessionUser } from '../../../../utils/session';
import { getEmailBaseUrl } from '../../../../utils/url';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
      console.log('POST /api/admin/tasks/assign - Starting request');
  
  // Get the authenticated user
  console.log('POST /api/admin/tasks/assign - About to check authentication');
  const currentUser = await getSessionUser({ cookies } as any);
  if (!currentUser) {
    console.log('POST /api/admin/tasks/assign - Authentication failed - no user returned');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  console.log('POST /api/admin/tasks/assign - Authentication successful - user:', currentUser.id);

    const body = await request.json();
    const { taskId, userIds } = body;

    console.log('POST /api/admin/tasks/assign - Request body:', { taskId, userIds });

    if (!taskId || !userIds || !Array.isArray(userIds)) {
      console.log('POST /api/admin/tasks/assign - Validation failed:', { taskId, userIds });
      return new Response(JSON.stringify({ error: 'Task ID and user IDs array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get task and project information for email notifications
    console.log('POST /api/admin/tasks/assign - Getting task info for ID:', taskId);
    const taskInfo = await getTaskWithProject(parseInt(taskId));
    if (!taskInfo) {
      console.log('POST /api/admin/tasks/assign - Task not found');
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/admin/tasks/assign - Task found:', taskInfo.name);

    // Validate that the task exists in the database
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, parseInt(taskId)))
      .limit(1);
    
    if (taskExists.length === 0) {
      console.log('POST /api/admin/tasks/assign - Task does not exist in database');
      return new Response(JSON.stringify({ error: 'Task not found in database' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('POST /api/admin/tasks/assign - Task exists in database');

    // Get current user information for the "assigned by" field
    const assignedByUser = await getUserById(currentUser.id);
    const assignedByName = assignedByUser?.name || 'Unknown User';

    // First, remove all existing assignments for this task
    console.log('POST /api/admin/tasks/assign - Removing existing assignments for task:', taskId);
    try {
      await db
        .delete(taskAssignments)
        .where(eq(taskAssignments.taskId, parseInt(taskId)));
      console.log('POST /api/admin/tasks/assign - Existing assignments removed successfully');
    } catch (deleteError) {
      console.error('POST /api/admin/tasks/assign - Error removing existing assignments:', deleteError);
      throw new Error(`Failed to remove existing assignments: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
    }

    // Then, add new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map(userId => ({
        taskId: parseInt(taskId),
        userId: parseInt(userId),
      }));

      console.log('POST /api/admin/tasks/assign - Adding new assignments:', assignments);
      
      // Validate that all users exist
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, userIds.map(id => parseInt(id))));
      
      console.log('POST /api/admin/tasks/assign - Found existing users:', existingUsers.map(u => u.id));
      
      if (existingUsers.length !== userIds.length) {
        const foundUserIds = existingUsers.map(u => u.id);
        const missingUserIds = userIds.filter(id => !foundUserIds.includes(parseInt(id)));
        throw new Error(`Some users not found: ${missingUserIds.join(', ')}`);
      }
      
      try {
        await db.insert(taskAssignments).values(assignments);
        console.log('POST /api/admin/tasks/assign - Assignments added successfully');
      } catch (insertError) {
        console.error('POST /api/admin/tasks/assign - Error adding assignments:', insertError);
        throw new Error(`Failed to add assignments: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }

      // Send email notifications to newly assigned users
      try {
        const assignedUsers = await getUsersByIds(userIds.map(id => parseInt(id)));
        
        // Get the base URL for the dashboard link
        const baseUrl = getEmailBaseUrl();
        const dashboardUrl = `${baseUrl}/dashboard`;

        // Send emails to each assigned user
        for (const user of assignedUsers) {
          if (user.email && user.id !== currentUser.id) { // Don't send email to the person doing the assignment
            try {
              console.log(`📧 Attempting to send task assignment email to ${user.email}`);
              await sendTaskAssignmentEmail({
                email: user.email,
                userName: user.name,
                taskName: taskInfo.name,
                projectName: taskInfo.projectName,
                assignedBy: assignedByName,
                taskDescription: taskInfo.description || undefined,
                dashboardUrl: dashboardUrl,
              });
              console.log(`📧 Task assignment email sent to ${user.email}`);
            } catch (emailError) {
              console.error(`Failed to send task assignment email to ${user.email}:`, emailError);
              // Don't fail the entire operation if email fails
            }
          } else {
            console.log(`📧 Skipping email for user ${user.email} (same user or no email)`);
          }
        }
      } catch (notificationError) {
        console.error('Error sending task assignment notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Task assignments updated successfully',
      notificationsSent: userIds.length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/admin/tasks/assign - Error updating task assignments:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('POST /api/admin/tasks/assign - Error name:', error.name);
      console.error('POST /api/admin/tasks/assign - Error message:', error.message);
      console.error('POST /api/admin/tasks/assign - Error stack:', error.stack);
    }
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connection')) {
      return new Response(JSON.stringify({ 
        error: 'Database connection error', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid task or user ID', 
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to update task assignments', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 