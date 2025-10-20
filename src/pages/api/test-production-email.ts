import type { APIRoute } from 'astro';
import { sendSubtaskAssignmentEmail } from '../../utils/email';

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    const publicSiteUrl = process.env.PUBLIC_SITE_URL;
    const baseUrl = process.env.BASE_URL;

    const envStatus = {
      RESEND_API_KEY: resendApiKey ? 'SET' : 'NOT SET',
      DATABASE_URL: databaseUrl ? 'SET' : 'NOT SET',
      PUBLIC_SITE_URL: publicSiteUrl || 'NOT SET',
      BASE_URL: baseUrl || 'NOT SET'
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Production environment check',
      environment: envStatus,
      emailConfigured: !!resendApiKey,
      instructions: resendApiKey ? 
        'Email is configured - test with POST request' : 
        'Set RESEND_API_KEY in Vercel dashboard to enable emails'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test subtask email
    const result = await sendSubtaskAssignmentEmail({
      email,
      userName: 'Test User',
      subtaskName: 'Test Subtask',
      taskName: 'Test Task',
      projectName: 'Test Project',
      assignedBy: 'System',
      subtaskDescription: 'This is a test subtask for production email testing.',
      dashboardUrl: 'https://trackr.times10.net/dashboard'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Production subtask email test sent',
      data: result,
      isRealEmail: !result.id?.toString().startsWith('test-')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
