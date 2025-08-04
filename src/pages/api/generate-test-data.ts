import type { APIRoute } from 'astro';
import { generateTestData } from '../../scripts/generate-test-data';

export const POST: APIRoute = async () => {
  try {
    console.log('🚀 Starting test data generation via API...');
    
    await generateTestData();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test data generated successfully!'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to generate test data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 