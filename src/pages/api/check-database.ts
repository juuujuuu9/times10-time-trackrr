import type { APIRoute } from 'astro';
import { db } from '../../db/index';

export const GET: APIRoute = async () => {
  try {
    // Get database information
    const result = await db.execute(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        NOW() as current_time,
        version() as postgres_version
    `);
    
    const dbInfo = result.rows[0];
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection info',
      data: {
        database_name: dbInfo.database_name,
        current_user: dbInfo.current_user,
        current_time: dbInfo.current_time,
        postgres_version: dbInfo.postgres_version,
        // Extract database endpoint from connection
        database_endpoint: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database_endpoint: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
