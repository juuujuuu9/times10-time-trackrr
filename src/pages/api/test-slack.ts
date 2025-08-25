import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    const channelId = formData.get('channel_id') as string;

    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `✅ Test successful! Command: ${command}, Text: ${text}, User: ${userId}, Team: ${teamId}, Channel: ${channelId}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: '❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
