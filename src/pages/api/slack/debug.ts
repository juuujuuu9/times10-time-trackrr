import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Debug endpoint hit');
    
    // Log all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log('Request headers:', headers);
    
    // Try to parse form data
    let formData: any = {};
    try {
      const data = await request.formData();
      data.forEach((value, key) => {
        formData[key] = value;
      });
      console.log('Form data:', formData);
    } catch (error) {
      console.log('Failed to parse form data:', error);
    }
    
    // Try to parse as JSON
    let jsonData: any = null;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      if (text) {
        jsonData = JSON.parse(text);
        console.log('JSON data:', jsonData);
      }
    } catch (error) {
      console.log('Failed to parse JSON:', error);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Debug endpoint working',
      headers: Object.keys(headers),
      formData: Object.keys(formData),
      hasJsonData: !!jsonData,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
