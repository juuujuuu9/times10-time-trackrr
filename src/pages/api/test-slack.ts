import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
