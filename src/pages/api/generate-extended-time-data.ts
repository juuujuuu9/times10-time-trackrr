import type { APIRoute } from 'astro';
import { generateExtendedTimeData } from '../../scripts/generate-extended-time-data';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🚀 Starting extended time data generation via API...');
    
    // Parse request body to check if we should clear existing entries
    let clearExisting = false;
    try {
      const body = await request.json();
      clearExisting = body.clearExisting || false;
    } catch (e) {
      // If no body or invalid JSON, use default
      clearExisting = false;
    }
    
    const entries = await generateExtendedTimeData(clearExisting);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Extended time data generated successfully!',
      data: {
        entriesGenerated: entries.length,
        clearExisting
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating extended time data:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to generate extended time data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 