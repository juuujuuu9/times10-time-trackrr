import type { APIRoute } from 'astro';
import { 
  sendCollaborationRemovalEmail, 
  sendTaskReassignmentEmail, 
  sendDueSoonReminderEmail, 
  sendOverdueNotificationEmail, 
  sendTaskStatusChangeEmail, 
  sendDueDateChangeEmail, 
  sendTaskCompletionEmail,
  sendNewInsightEmail,
  sendInsightReplyEmail,
  sendInsightLikedEmail,
  sendAttachmentAddedEmail,
  sendInsightResolvedEmail
} from '../../utils/email';
import { getEmailBaseUrl } from '../../utils/url';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { testType, email } = body;

    if (!testType || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'testType and email are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = getEmailBaseUrl();
    const dashboardUrl = `${baseUrl}/dashboard`;
    const snoozeUrl = `${baseUrl}/api/snooze-reminder`;

    let result;

    switch (testType) {
      case 'collaboration-removal':
        result = await sendCollaborationRemovalEmail({
          email,
          userName: 'Test User',
          collaborationName: 'Test Collaboration',
          projectName: 'Test Project',
          removedBy: 'Admin User',
          reason: 'Test removal for notification testing',
          fallbackUrl: dashboardUrl
        });
        break;

      case 'task-reassignment':
        result = await sendTaskReassignmentEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          reassignedBy: 'Admin User',
          reason: 'Test reassignment for notification testing',
          previousAssignee: 'Previous User',
          dashboardUrl: dashboardUrl
        });
        break;

      case 'due-soon':
        result = await sendDueSoonReminderEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          dueDate: '2024-12-25',
          daysUntilDue: 2,
          dashboardUrl: dashboardUrl,
          snoozeUrl: snoozeUrl
        });
        break;

      case 'overdue':
        result = await sendOverdueNotificationEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          dueDate: '2024-12-20',
          daysOverdue: 3,
          dashboardUrl: dashboardUrl,
          snoozeUrl: snoozeUrl
        });
        break;

      case 'status-change':
        result = await sendTaskStatusChangeEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          oldStatus: 'pending',
          newStatus: 'in_progress',
          changedBy: 'Admin User',
          dashboardUrl: dashboardUrl
        });
        break;

      case 'due-date-change':
        result = await sendDueDateChangeEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          oldDueDate: '2024-12-25',
          newDueDate: '2024-12-30',
          changedBy: 'Admin User',
          dashboardUrl: dashboardUrl
        });
        break;

      case 'task-completion':
        result = await sendTaskCompletionEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          completedBy: 'Test User',
          completionDate: new Date().toLocaleDateString(),
          remainingBlockers: ['Review needed', 'Documentation pending'],
          dashboardUrl: dashboardUrl
        });
        break;

      case 'new-insight':
        result = await sendNewInsightEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          insightAuthor: 'Team Member',
          insightContent: 'This is a test insight about the task progress and potential improvements.',
          taskStreamUrl: dashboardUrl
        });
        break;

      case 'insight-reply':
        result = await sendInsightReplyEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          repliedBy: 'Team Member',
          replyContent: 'Thanks for the insight! I agree with your assessment.',
          originalInsightContent: 'This is a test insight about the task progress and potential improvements.',
          taskStreamUrl: dashboardUrl
        });
        break;

      case 'insight-liked':
        result = await sendInsightLikedEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          likedBy: 'Team Member',
          insightContent: 'This is a test insight about the task progress and potential improvements.',
          taskStreamUrl: dashboardUrl
        });
        break;

      case 'attachment-added':
        result = await sendAttachmentAddedEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          uploadedBy: 'Team Member',
          fileName: 'project-specification.pdf',
          fileSize: '2.3 MB',
          attachmentType: 'Document',
          taskStreamUrl: dashboardUrl
        });
        break;

      case 'insight-resolved':
        result = await sendInsightResolvedEmail({
          email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          resolvedBy: 'Team Lead',
          resolutionSummary: 'The issue has been resolved by implementing the suggested changes.',
          originalInsightContent: 'This is a test insight about the task progress and potential improvements.',
          taskStreamUrl: dashboardUrl
        });
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid testType. Valid types: collaboration-removal, task-reassignment, due-soon, overdue, status-change, due-date-change, task-completion, new-insight, insight-reply, insight-liked, attachment-added, insight-resolved'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${testType} notification sent successfully`,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
