import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Simple test endpoint hit');
    
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
    
    // Return a simple success response
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `✅ Simple test successful!
Command: ${command || 'none'}
Text: ${text || 'none'}
User: ${userId || 'none'}
Team: ${teamId || 'none'}
Channel: ${channelId || 'none'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple test error:', error);
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `❌ Simple test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
