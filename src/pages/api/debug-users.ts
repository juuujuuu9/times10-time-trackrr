import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Debugging users...');

    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.id)]
    });

    console.log(`Found ${allUsers.length} users`);

    return new Response(JSON.stringify({ 
      message: `Found ${allUsers.length} users`,
      success: true,
      users: allUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error debugging users:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug users',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
