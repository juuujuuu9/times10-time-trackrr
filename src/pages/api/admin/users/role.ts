import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return new Response(JSON.stringify({ error: 'User ID and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be "admin" or "user"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedUser = await db
      .update(users)
      .set({ 
        role,
        updatedAt: new Date() 
      })
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (updatedUser.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedUser[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 