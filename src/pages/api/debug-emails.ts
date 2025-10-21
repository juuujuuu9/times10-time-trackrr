import type { APIRoute } from 'astro';
import { 
  sendInvitationEmail,
  sendCollaborationAssignmentEmail,
  sendTaskAssignmentEmail,
  sendSubtaskAssignmentEmail,
  sendMentionNotificationEmail,
  sendTaskReassignmentEmail,
  sendDueSoonReminderEmail,
  sendTaskCompletionEmail,
  sendNewInsightEmail
} from '../../utils/email';
import { getEmailBaseUrl } from '../../utils/url';
import { logEmailDebugInfo, isLocalDebugMode } from '../../utils/localEmailDebug';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, testType = 'all' } = body;

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email address is required for testing'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = getEmailBaseUrl();
    const dashboardUrl = `${baseUrl}/dashboard`;
    const snoozeUrl = `${baseUrl}/api/snooze-reminder`;

    console.log('\n🧪 LOCAL EMAIL DEBUG TESTING');
    console.log('=' .repeat(50));
    console.log('📧 Debug Mode:', isLocalDebugMode() ? 'ENABLED' : 'DISABLED');
    console.log('📧 Test Email:', email);
    console.log('📧 Test Type:', testType);
    console.log('📧 Base URL:', baseUrl);
    console.log('=' .repeat(50));

    const results: any[] = [];

    // Test invitation email
    if (testType === 'all' || testType === 'invitation') {
      logEmailDebugInfo('Invitation', { email, name: 'Test User', role: 'Member' });
      const result = await sendInvitationEmail({
        email,
        name: 'Test User',
        role: 'Member',
        invitationUrl: `${baseUrl}/invite/test-token`,
        invitedBy: 'Admin User'
      });
      results.push({ type: 'invitation', result });
    }

    // Test collaboration assignment
    if (testType === 'all' || testType === 'collaboration') {
      logEmailDebugInfo('Collaboration Assignment', { email, collaborationName: 'Test Collaboration' });
      const result = await sendCollaborationAssignmentEmail({
        email,
        userName: 'Test User',
        collaborationName: 'Test Collaboration',
        projectName: 'Test Project',
        addedBy: 'Admin User',
        collaborationDescription: 'This is a test collaboration for email debugging.',
        dashboardUrl
      });
      results.push({ type: 'collaboration', result });
    }

    // Test task assignment
    if (testType === 'all' || testType === 'task') {
      logEmailDebugInfo('Task Assignment', { email, taskName: 'Test Task' });
      const result = await sendTaskAssignmentEmail({
        email,
        userName: 'Test User',
        taskName: 'Test Task',
        projectName: 'Test Project',
        assignedBy: 'Admin User',
        taskDescription: 'This is a test task for email debugging.',
        dashboardUrl
      });
      results.push({ type: 'task', result });
    }

    // Test subtask assignment
    if (testType === 'all' || testType === 'subtask') {
      logEmailDebugInfo('Subtask Assignment', { email, subtaskName: 'Test Subtask' });
      const result = await sendSubtaskAssignmentEmail({
        email,
        userName: 'Test User',
        subtaskName: 'Test Subtask',
        taskName: 'Parent Test Task',
        projectName: 'Test Project',
        assignedBy: 'Admin User',
        subtaskDescription: 'This is a test subtask for email debugging.',
        dashboardUrl
      });
      results.push({ type: 'subtask', result });
    }

    // Test mention notification
    if (testType === 'all' || testType === 'mention') {
      logEmailDebugInfo('Mention Notification', { email, mentionedBy: 'Admin User' });
      const result = await sendMentionNotificationEmail({
        email,
        userName: 'Test User',
        mentionedBy: 'Admin User',
        content: 'This is a test message that mentions @TestUser in a task discussion.',
        taskName: 'Test Task',
        projectName: 'Test Project',
        taskStreamUrl: `${baseUrl}/admin/collaborations/1/task/1`,
        postType: 'insight'
      });
      results.push({ type: 'mention', result });
    }

    // Test task reassignment
    if (testType === 'all' || testType === 'reassignment') {
      logEmailDebugInfo('Task Reassignment', { email, taskName: 'Test Task' });
      const result = await sendTaskReassignmentEmail({
        email,
        userName: 'Test User',
        taskName: 'Test Task',
        projectName: 'Test Project',
        reassignedBy: 'Admin User',
        previousAssignee: 'Previous User',
        taskDescription: 'This is a test task reassignment for email debugging.',
        dashboardUrl
      });
      results.push({ type: 'reassignment', result });
    }

    // Test due soon reminder
    if (testType === 'all' || testType === 'due-soon') {
      logEmailDebugInfo('Due Soon Reminder', { email, taskName: 'Test Task', daysUntilDue: 2 });
      const result = await sendDueSoonReminderEmail({
        email,
        userName: 'Test User',
        taskName: 'Test Task',
        projectName: 'Test Project',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysUntilDue: 2,
        dashboardUrl,
        snoozeUrl
      });
      results.push({ type: 'due-soon', result });
    }

    // Test task completion
    if (testType === 'all' || testType === 'completion') {
      logEmailDebugInfo('Task Completion', { email, taskName: 'Test Task' });
      const result = await sendTaskCompletionEmail({
        email,
        userName: 'Test User',
        taskName: 'Test Task',
        projectName: 'Test Project',
        completedBy: 'Test User',
        completionDate: new Date().toISOString().split('T')[0],
        dashboardUrl
      });
      results.push({ type: 'completion', result });
    }

    // Test new insight
    if (testType === 'all' || testType === 'insight') {
      logEmailDebugInfo('New Insight', { email, taskName: 'Test Task', insightAuthor: 'Admin User' });
      const result = await sendNewInsightEmail({
        email,
        userName: 'Test User',
        taskName: 'Test Task',
        projectName: 'Test Project',
        insightAuthor: 'Admin User',
        insightContent: 'This is a test insight for email debugging.',
        taskStreamUrl: `${baseUrl}/admin/collaborations/1/task/1`
      });
      results.push({ type: 'insight', result });
    }

    console.log('\n✅ LOCAL EMAIL DEBUG TESTING COMPLETE');
    console.log('📧 Check captured emails at: http://localhost:1080');
    console.log('📧 Results:', results.length, 'emails sent');

    return new Response(JSON.stringify({
      success: true,
      message: `Local email debugging completed. ${results.length} emails sent.`,
      debugMode: isLocalDebugMode(),
      webInterface: 'http://localhost:1080',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ LOCAL EMAIL DEBUG ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send debug emails',
      details: error instanceof Error ? error.message : 'Unknown error',
      debugMode: isLocalDebugMode()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

