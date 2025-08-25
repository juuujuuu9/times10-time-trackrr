import type { APIRoute } from 'astro';

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Slack-Signature, X-Slack-Request-Timestamp',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Minimal commands endpoint hit at:', new Date().toISOString());
    
    // Get the raw body
    const rawBody = await request.text();
    console.log('Raw body length:', rawBody.length);
    
    // Parse form data
    const formData = new URLSearchParams(rawBody);
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    const channelId = formData.get('channel_id') as string;
    
    console.log('Parsed data:', { command, text, userId, teamId, channelId });
    
    // Simple response based on command
    let response = '';
    
    switch (command) {
      case '/tasks':
        response = '📋 This is a test response for /tasks command. The full functionality is being debugged.';
        break;
      case '/track':
        response = '⏱️ This is a test response for /track command. The full functionality is being debugged.';
        break;
      case '/time-status':
        response = '📊 This is a test response for /time-status command. The full functionality is being debugged.';
        break;
      default:
        response = '❌ Unknown command. Available commands: `/track`, `/tasks`, `/time-status`';
    }
    
    const responseBody = JSON.stringify({
      response_type: 'ephemeral',
      text: response
    });
    
    console.log('Sending response:', responseBody);
    
    return new Response(responseBody, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Slack-Signature, X-Slack-Request-Timestamp',
      }
    });

  } catch (error) {
    console.error('Minimal commands error:', error);
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Slack-Signature, X-Slack-Request-Timestamp',
      }
    });
  }
};
