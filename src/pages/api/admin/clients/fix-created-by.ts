import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clients, users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../../../utils/session';

// Admin-only endpoint to set all clients.created_by to the provided userId
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireAuth('/')({ request } as any);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { targetUserId } = body as { targetUserId?: number };
    if (!targetUserId || typeof targetUserId !== 'number') {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate user exists
    const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
    if (target.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await db.update(clients).set({ createdBy: targetUserId }).returning({ id: clients.id });

    return new Response(JSON.stringify({ success: true, updatedCount: updated.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fixing clients.created_by:', error);
    return new Response(JSON.stringify({ error: 'Failed to update clients' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


