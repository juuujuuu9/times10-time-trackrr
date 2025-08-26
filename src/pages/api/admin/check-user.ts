import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length === 0) {
      return new Response(JSON.stringify({ 
        exists: false,
        message: 'User not found'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = existingUser[0];
    return new Response(JSON.stringify({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        payRate: user.payRate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return new Response(JSON.stringify({ error: 'Failed to check user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
