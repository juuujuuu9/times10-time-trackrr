import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const test = formData.get('test') as string;
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Middleware test successful',
      test: test
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Middleware test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
