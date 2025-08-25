import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';

export const GET: APIRoute = async () => {
  try {
    console.log('Users list requested');
    
    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.name)]
    });
    
    console.log('Found users:', allUsers.length);
    
    return new Response(JSON.stringify({
      status: 'success',
      users: allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      })),
      totalUsers: allUsers.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Users list failed:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
