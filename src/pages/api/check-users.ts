import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Checking users in database...');
    
    // Get all users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.createdAt);
    
    console.log('👥 Users found:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        usersCount: allUsers.length,
        users: allUsers
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
