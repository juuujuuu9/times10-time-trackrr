import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../utils/auth';
import { validateInvitationToken, markInvitationTokenAsUsed } from '../../utils/invitation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate the invitation token
    const tokenValidation = await validateInvitationToken(token);
    if (!tokenValidation.valid) {
      return new Response(JSON.stringify({ error: tokenValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the user by email
    const user = await db.select().from(users).where(eq(users.email, tokenValidation.email!)).limit(1);
    if (user.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user with the new password and change status to active
    const updatedUser = await db
      .update(users)
      .set({
        password: hashedPassword,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user[0].id))
      .returning();

    // Mark the invitation token as used
    await markInvitationTokenAsUsed(token);

    return new Response(JSON.stringify({ 
      message: 'Account setup successful',
      user: updatedUser[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting up account:', error);
    return new Response(JSON.stringify({ error: 'Failed to set up account' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 