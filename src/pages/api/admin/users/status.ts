import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'User ID and status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be "active" or "inactive"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll just update the user's updatedAt timestamp
    // In a real app, you might have a separate status field
    const updatedUser = await db
      .update(users)
      .set({ 
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

    return new Response(JSON.stringify({ message: `User ${status} successfully` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 