import type { APIRoute } from 'astro';
import { getUserByEmail, createPasswordResetToken } from '../../../utils/passwordReset';
import { sendPasswordResetEmail } from '../../../utils/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      // Always return success to prevent email enumeration
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create password reset token
    const token = await createPasswordResetToken(user.id);

    // Get base URL for reset link
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:4321';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send password reset email
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in request-password-reset:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
