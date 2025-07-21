import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { clients } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deletedClient = await db
      .delete(clients)
      .where(eq(clients.id, parseInt(id)))
      .returning();

    if (deletedClient.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Client deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete client' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 