import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { validatePasswordResetToken, markPasswordResetTokenAsUsed } from '../../../utils/passwordReset';
import { hashPassword } from '../../../utils/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate password requirements
    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate the reset token
    const tokenValidation = await validatePasswordResetToken(token);
    if (!tokenValidation.valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: tokenValidation.error || 'Invalid or expired reset token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, tokenValidation.userId!));

    // Mark the reset token as used
    await markPasswordResetTokenAsUsed(token);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password has been reset successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in reset-password:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An error occurred while resetting your password' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
