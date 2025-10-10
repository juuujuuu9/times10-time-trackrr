import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users, sessions } from '../../../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../../../utils/auth';

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the current user from session
    const token = cookies.get('session_token')?.value;
    let currentUser = null;

    if (token) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
        with: {
          user: true
        }
      });

      if (session && session.user.status === 'active') {
        currentUser = session.user;
      }
    }

    if (!currentUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    const updateData: any = { 
      updatedAt: new Date() 
    };

    // Update name if provided
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }

    // Update email if provided
    if (email !== undefined && email.trim() !== '') {
      // Check if email is already in use by another user
      const existingUser = await db.query.users.findFirst({
        where: and(eq(users.email, email.trim()), ne(users.id, currentUser.id))
      });

      if (existingUser) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Email address is already in use' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      updateData.email = email.trim();
    }

    // Update password if provided
    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (!currentPassword) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Current password is required to change password' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Current password is incorrect' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'New password must be at least 8 characters long' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      updateData.password = await hashPassword(newPassword);
    }

    // Update the user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        role: updatedUser[0].role,
        status: updatedUser[0].status
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update profile' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
