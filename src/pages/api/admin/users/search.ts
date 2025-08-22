import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users } from '../../../../db/schema';
import { ilike, or, and, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const activeOnly = url.searchParams.get('activeOnly') === 'true';

    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users);

    // Add filters
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(users.name, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`)
        )
      );
    }
    
    if (activeOnly) {
      conditions.push(eq(users.status, 'active'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(users.name)
      .limit(limit);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to search users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
