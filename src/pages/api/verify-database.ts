import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';

export const GET: APIRoute = async () => {
  try {
    // Get the first 5 users to see what data is actually being returned
    const allUsers = await db.query.users.findMany({ 
      limit: 5,
      orderBy: (users, { asc }) => [asc(users.id)]
    });
    
    // Get database connection info
    const dbInfo = await db.execute(`
      SELECT 
        current_database() as database_name,
        inet_server_addr() as server_ip,
        current_user as current_user
    `);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database verification',
      database_info: dbInfo.rows[0],
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      })),
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Database verification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
