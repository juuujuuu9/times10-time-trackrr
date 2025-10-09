import type { APIRoute } from 'astro';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async (context) => {
  try {
    const user = await getSessionUser(context);
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No user session found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error checking user role:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
