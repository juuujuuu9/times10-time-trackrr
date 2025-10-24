import type { APIContext } from 'astro';
import { db } from '../db';
import { sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isTokenExpired } from './auth';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
}

export async function getSessionUser(context: APIContext): Promise<AuthenticatedUser | null> {
  try {
    const token = context.cookies.get('session_token')?.value;

    if (!token) {
      return null;
    }

    // Find session and user
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      with: {
        user: true
      }
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (isTokenExpired(session.expiresAt)) {
      // Delete expired session
      await db.delete(sessions).where(eq(sessions.token, token));
      return null;
    }

    // Check if user is still active
    if (session.user.status !== 'active') {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      status: session.user.status
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function requireAuth(context: APIContext, redirectTo: string = '/') {
  // Check if context is valid and is an APIContext object
  if (!context || typeof context !== 'object') {
    console.error('Invalid context provided to requireAuth:', typeof context);
    return null;
  }
  
  const user = await getSessionUser(context);
  
  if (!user) {
    // Check if this is an API context (has request property)
    if ('request' in context) {
      // For API contexts, return null instead of throwing
      return null;
    } else {
      // For page contexts, try to redirect
      try {
        return context.redirect(redirectTo);
      } catch (error) {
        // If redirect fails (response already sent), throw an error to prevent rendering
        throw new Error('Authentication required');
      }
    }
  }
  
  return user;
}

export async function requireRole(context: APIContext, requiredRole: string, redirectTo: string = '/dashboard') {
  // Check if context is valid and is an APIContext object
  if (!context || typeof context !== 'object') {
    console.error('Invalid context provided to requireRole:', typeof context, context);
    return null;
  }
  
  const user = await getSessionUser(context);
  
  if (!user) {
    // Check if this is an API context (has request property)
    if ('request' in context) {
      // For API contexts, return null instead of throwing
      return null;
    } else {
      // For page contexts, try to redirect
      try {
        return context.redirect('/');
      } catch (error) {
        // If redirect fails (response already sent), throw an error to prevent rendering
        throw new Error('Authentication required');
      }
    }
  }
  
  const roleHierarchy = {
    'admin': 3,
    'developer': 3,
    'team_manager': 2,
    'user': 1,
  };
  
  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  if (userLevel < requiredLevel) {
    // Check if this is an API context (has request property)
    if ('request' in context) {
      // For API contexts, return null instead of throwing
      return null;
    } else {
      // For page contexts, try to redirect
      try {
        return context.redirect(redirectTo);
      } catch (error) {
        // If redirect fails (response already sent), throw an error to prevent rendering
        throw new Error('Insufficient permissions');
      }
    }
  }
  
  return user;
} 