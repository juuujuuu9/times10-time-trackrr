import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Simple test endpoint hit');
    
    // Log all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log('Request headers:', headers);
    
    // Try to get the body
    let body = '';
    try {
      body = await request.text();
      console.log('Request body:', body);
    } catch (error) {
      console.log('Failed to read body:', error);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Simple test successful',
      headers: Object.keys(headers),
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple test error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
