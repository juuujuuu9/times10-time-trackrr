import type { APIRoute } from 'astro';
import { handleSlackOAuth } from '../../../utils/slack';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: `Slack authorization failed: ${error}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization code is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientId = import.meta.env.SLACK_CLIENT_ID;
    const clientSecret = import.meta.env.SLACK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slack configuration is missing'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await handleSlackOAuth(code, clientId, clientSecret);

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/admin/slack/success?workspace=${encodeURIComponent(result.workspaceName)}`
      }
    });

  } catch (error) {
    console.error('Slack OAuth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to complete Slack authorization'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
