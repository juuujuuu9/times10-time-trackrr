import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { taskAssignments } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendTaskAssignmentEmail } from '../../../../utils/email';
import { getTaskWithProject, getUsersByIds, getUserById } from '../../../../db/queries';
import { requireAuth } from '../../../../utils/session';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require authentication
    const currentUser = await requireAuth('/login')({ request } as any) as any;
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { taskId, userIds } = body;

    if (!taskId || !userIds || !Array.isArray(userIds)) {
      return new Response(JSON.stringify({ error: 'Task ID and user IDs array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get task and project information for email notifications
    const taskInfo = await getTaskWithProject(parseInt(taskId));
    if (!taskInfo) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user information for the "assigned by" field
    const assignedByUser = await getUserById(currentUser.id);
    const assignedByName = assignedByUser?.name || 'Unknown User';

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

      // Send email notifications to newly assigned users
      try {
        const assignedUsers = await getUsersByIds(userIds.map(id => parseInt(id)));
        
        // Get the base URL for the dashboard link
        const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
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
    console.error('Error updating task assignments:', error);
    return new Response(JSON.stringify({ error: 'Failed to update task assignments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 