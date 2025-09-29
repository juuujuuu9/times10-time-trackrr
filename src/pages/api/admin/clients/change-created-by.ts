import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { clients, users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { clientId, newCreatedBy } = body;

    if (!clientId || !newCreatedBy) {
      return new Response(JSON.stringify({ error: 'Client ID and new creator ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the client exists
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the new creator exists
    const newCreator = await db
      .select()
      .from(users)
      .where(eq(users.id, newCreatedBy))
      .limit(1);

    if (newCreator.length === 0) {
      return new Response(JSON.stringify({ error: 'New creator not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the client's createdBy field
    await db
      .update(clients)
      .set({ 
        createdBy: newCreatedBy,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId));

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Client creator updated successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating client creator:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update client creator'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
