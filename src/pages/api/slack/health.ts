import type { APIRoute } from 'astro';
import { db } from '../../../db';

export const GET: APIRoute = async () => {
  try {
    console.log('Health check requested');
    
    // Test database connection
    const result = await db.execute('SELECT 1 as test');
    console.log('Database connection successful');
    
    return new Response(JSON.stringify({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
