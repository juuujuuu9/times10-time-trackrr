import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all active users
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(users.name);

    return new Response(JSON.stringify({
      success: true,
      data: allUsers
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch users'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
