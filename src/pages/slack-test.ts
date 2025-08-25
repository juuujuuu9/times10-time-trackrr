import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const command = formData.get('command') as string;
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `Test successful! Command: ${command}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
