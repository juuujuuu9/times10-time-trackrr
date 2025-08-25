import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({
    response_type: 'ephemeral',
    text: 'Simple test successful!'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
