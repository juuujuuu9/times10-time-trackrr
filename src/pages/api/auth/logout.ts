import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const token = cookies.get('session_token')?.value;
    console.log('Logout request - token:', token ? 'present' : 'missing');

    if (token) {
      // Delete session from database
      const result = await db.delete(sessions).where(eq(sessions.token, token));
      console.log('Session deleted from database');
    }

    // Clear session cookie
    cookies.delete('session_token', { path: '/' });
    console.log('Session cookie cleared');

    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 