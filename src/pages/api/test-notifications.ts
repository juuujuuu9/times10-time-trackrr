import type { APIRoute } from 'astro';
import { sendCollaborationAssignmentEmail, sendTaskAssignmentEmail, sendSubtaskAssignmentEmail } from '../../utils/email';
import { getEmailBaseUrl } from '../../utils/url';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { testType, email } = body;

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

    let result;

    switch (testType) {
      case 'collaboration':
        console.log('🧪 Testing collaboration assignment email...');
        result = await sendCollaborationAssignmentEmail({
          email: email,
          userName: 'Test User',
          collaborationName: 'Test Collaboration',
          projectName: 'Test Project',
          addedBy: 'Admin User',
          collaborationDescription: 'This is a test collaboration for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        break;

      case 'task':
        console.log('🧪 Testing task assignment email...');
        result = await sendTaskAssignmentEmail({
          email: email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          assignedBy: 'Admin User',
          taskDescription: 'This is a test task for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        break;

      case 'subtask':
        console.log('🧪 Testing subtask assignment email...');
        result = await sendSubtaskAssignmentEmail({
          email: email,
          userName: 'Test User',
          subtaskName: 'Test Subtask',
          taskName: 'Test Task',
          projectName: 'Test Project',
          assignedBy: 'Admin User',
          subtaskDescription: 'This is a test subtask for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        break;

      case 'all':
        console.log('🧪 Testing all notification types...');
        const results = [];
        
        // Test collaboration email
        const collaborationResult = await sendCollaborationAssignmentEmail({
          email: email,
          userName: 'Test User',
          collaborationName: 'Test Collaboration',
          projectName: 'Test Project',
          addedBy: 'Admin User',
          collaborationDescription: 'This is a test collaboration for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        results.push({ type: 'collaboration', result: collaborationResult });

        // Test task email
        const taskResult = await sendTaskAssignmentEmail({
          email: email,
          userName: 'Test User',
          taskName: 'Test Task',
          projectName: 'Test Project',
          assignedBy: 'Admin User',
          taskDescription: 'This is a test task for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        results.push({ type: 'task', result: taskResult });

        // Test subtask email
        const subtaskResult = await sendSubtaskAssignmentEmail({
          email: email,
          userName: 'Test User',
          subtaskName: 'Test Subtask',
          taskName: 'Test Task',
          projectName: 'Test Project',
          assignedBy: 'Admin User',
          subtaskDescription: 'This is a test subtask for email notification testing.',
          dashboardUrl: dashboardUrl,
        });
        results.push({ type: 'subtask', result: subtaskResult });

        result = results;
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid test type. Use: collaboration, task, subtask, or all'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Test ${testType} notification sent successfully`,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error testing notifications:', error);
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
