import type { APIRoute } from 'astro';
import { sendTaskAssignmentEmail } from '../../utils/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, userName, taskName, projectName, assignedBy, taskDescription, dashboardUrl } = body;

    if (!email || !userName || !taskName || !projectName || !assignedBy || !dashboardUrl) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email, userName, taskName, projectName, assignedBy, dashboardUrl' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send the test email
    const result = await sendTaskAssignmentEmail({
      email,
      userName,
      taskName,
      projectName,
      assignedBy,
      taskDescription,
      dashboardUrl,
    });

    return new Response(JSON.stringify({ 
      message: 'Test email sent successfully',
      id: result.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to send test email' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

