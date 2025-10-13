import { db } from '../../../../db/index';
import { users } from '../../../../db/schema';
import { ilike, or } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export async function GET(Astro: any) {
  try {
    // Check authentication
    const currentUser = await getSessionUser(Astro);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get search query
    const searchQuery = Astro.url.searchParams.get('q');
    if (!searchQuery || searchQuery.trim().length < 2) {
      return new Response(JSON.stringify({
        success: true,
        users: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Search users by name or email
    const searchResults = await db.query.users.findMany({
      where: or(
        ilike(users.name, `%${searchQuery}%`),
        ilike(users.email, `%${searchQuery}%`)
      ),
      limit: 20,
      columns: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return new Response(JSON.stringify({
      success: true,
      users: searchResults
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}