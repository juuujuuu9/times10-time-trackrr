import type { APIRoute } from 'astro';
import { sendSubtaskAssignmentEmail } from '../../utils/email';
import { getEmailBaseUrl } from '../../utils/url';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      subtasks, 
      taskId, 
      taskName, 
      projectName, 
      assignedBy 
    } = body;

    if (!subtasks || !Array.isArray(subtasks)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Subtasks array is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = getEmailBaseUrl();
    const dashboardUrl = `${baseUrl}/admin/collaborations/general`;

    const results = [];

    // Send emails for each subtask with assignees
    for (const subtask of subtasks) {
      if (subtask.assignees && subtask.assignees.length > 0) {
        for (const assigneeName of subtask.assignees) {
          try {
            console.log(`📧 Sending subtask creation email to ${assigneeName} for subtask: ${subtask.name}`);
            
            const result = await sendSubtaskAssignmentEmail({
              email: assigneeName, // This should be the email, not name - will be fixed in the calling code
              userName: assigneeName,
              subtaskName: subtask.name,
              taskName: taskName || 'Unknown Task',
              projectName: projectName || 'Unknown Project',
              assignedBy: assignedBy || 'System',
              subtaskDescription: subtask.description || undefined,
              dashboardUrl: dashboardUrl,
            });
            
            results.push({
              subtaskName: subtask.name,
              assignee: assigneeName,
              result: result
            });
            
            console.log(`📧 Subtask creation email sent to ${assigneeName}`);
          } catch (emailError) {
            console.error(`Failed to send subtask creation email to ${assigneeName}:`, emailError);
            results.push({
              subtaskName: subtask.name,
              assignee: assigneeName,
              error: emailError instanceof Error ? emailError.message : 'Unknown error'
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Subtask creation emails processed for ${results.length} assignments`,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending subtask creation emails:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send subtask creation emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
