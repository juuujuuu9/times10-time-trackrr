import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, sessions } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { isTokenExpired } from '../../../utils/auth';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const token = cookies.get('session_token')?.value;

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No session found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find session and user
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      with: {
        user: true
      }
    });

    if (!session) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if session is expired
    if (isTokenExpired(session.expiresAt)) {
      // Delete expired session
      await db.delete(sessions).where(eq(sessions.token, token));
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Session expired'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is still active
    if (session.user.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Account is not active'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        status: session.user.status
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 