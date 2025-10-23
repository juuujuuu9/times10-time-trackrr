import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { tasks, taskAssignments, users, projects } from '../../db/schema';
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm';
import { sendDueSoonReminderEmail, sendOverdueNotificationEmail } from '../../utils/email';
import { getEmailBaseUrl } from '../../utils/url';

export const prerender = false;

// GET /api/scheduled-notifications - Check for due soon and overdue tasks
export const GET: APIRoute = async () => {
  try {
    console.log('🔔 Running scheduled notification check...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    console.log('📅 Checking notifications for:', {
      today: today.toISOString().split('T')[0],
      tomorrow: tomorrow.toISOString().split('T')[0],
      dayAfterTomorrow: dayAfterTomorrow.toISOString().split('T')[0]
    });

    // Get tasks due soon (within 2 days) - using simpler query approach
    const dueSoonTasks = await db
      .select()
      .from(tasks)
      .where(and(
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, dayAfterTomorrow),
        gte(tasks.dueDate, today),
        eq(tasks.status, 'pending')
      ));

    console.log(`📋 Found ${dueSoonTasks.length} tasks due soon`);

    // Get overdue tasks - using simpler query approach
    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(and(
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, today),
        eq(tasks.status, 'pending')
      ));

    console.log(`📋 Found ${overdueTasks.length} overdue tasks`);

    const baseUrl = getEmailBaseUrl();
    const dashboardUrl = `${baseUrl}/dashboard`;
    const snoozeUrl = `${baseUrl}/api/snooze-task`;

    let dueSoonNotificationsSent = 0;
    let overdueNotificationsSent = 0;

    // Send due soon reminders
    for (const task of dueSoonTasks) {
      // Get task assignments for this task
      const taskAssignments = await db
        .select()
        .from(taskAssignments)
        .where(eq(taskAssignments.taskId, task.id));

      if (taskAssignments.length > 0) {
        const daysUntilDue = Math.ceil((task.dueDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        for (const assignment of taskAssignments) {
          // Get user details
          const user = await db.query.users.findFirst({
            where: eq(users.id, assignment.userId)
          });

          if (user && user.email) {
            try {
              console.log(`📧 Sending due soon reminder to ${user.email} for task "${task.name}"`);
              await sendDueSoonReminderEmail({
                email: user.email,
                userName: user.name,
                taskName: task.name,
                projectName: 'Test Project', // Simplified for testing
                dueDate: task.dueDate!.toLocaleDateString(),
                daysUntilDue: daysUntilDue,
                dashboardUrl: dashboardUrl,
                snoozeUrl: `${snoozeUrl}/${task.id}`
              });
              dueSoonNotificationsSent++;
              console.log(`📧 Due soon reminder sent to ${user.email}`);
            } catch (emailError) {
              console.error(`Failed to send due soon reminder to ${user.email}:`, emailError);
            }
          }
        }
      }
    }

    // Send overdue notifications
    for (const task of overdueTasks) {
      // Get task assignments for this task
      const taskAssignments = await db
        .select()
        .from(taskAssignments)
        .where(eq(taskAssignments.taskId, task.id));

      if (taskAssignments.length > 0) {
        const daysOverdue = Math.ceil((today.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
        
        for (const assignment of taskAssignments) {
          // Get user details
          const user = await db.query.users.findFirst({
            where: eq(users.id, assignment.userId)
          });

          if (user && user.email) {
            try {
              console.log(`📧 Sending overdue notification to ${user.email} for task "${task.name}"`);
              await sendOverdueNotificationEmail({
                email: user.email,
                userName: user.name,
                taskName: task.name,
                projectName: 'Test Project', // Simplified for testing
                dueDate: task.dueDate!.toLocaleDateString(),
                daysOverdue: daysOverdue,
                dashboardUrl: dashboardUrl,
                snoozeUrl: `${snoozeUrl}/${task.id}`
              });
              overdueNotificationsSent++;
              console.log(`📧 Overdue notification sent to ${user.email}`);
            } catch (emailError) {
              console.error(`Failed to send overdue notification to ${user.email}:`, emailError);
            }
          }
        }
      }
    }

    const result = {
      success: true,
      message: 'Scheduled notifications processed',
      data: {
        dueSoonTasks: dueSoonTasks.length,
        overdueTasks: overdueTasks.length,
        dueSoonNotificationsSent,
        overdueNotificationsSent,
        checkedAt: now.toISOString()
      }
    };

    console.log('🔔 Scheduled notification check completed:', result.data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error running scheduled notifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process scheduled notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/scheduled-notifications - Manual trigger for testing
export const POST: APIRoute = async () => {
  try {
    console.log('🔔 Manual trigger for scheduled notifications...');
    
    // This is the same logic as GET, but can be called manually for testing
    const getResponse = await GET();
    const responseData = await getResponse.json();
    
    return new Response(JSON.stringify({
      ...responseData,
      message: 'Manual trigger completed',
      triggeredAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in manual trigger:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to trigger scheduled notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
