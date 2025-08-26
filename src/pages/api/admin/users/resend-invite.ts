import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users, sessions } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { createInvitationToken } from '../../../../utils/invitation';
import { sendInvitationEmail } from '../../../../utils/email';

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Require authentication and admin role
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userResult.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userResult[0];

    // Check if user is in invited status
    if (user.status !== 'invited') {
      return new Response(JSON.stringify({ error: 'User is not in invited status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Create a new invitation token
      const token = await createInvitationToken(user.email);
      
      // Send invitation email
      const baseUrl = process.env.PUBLIC_SITE_URL || process.env.BASE_URL || 'https://trackr.times10.net';
      const invitationUrl = `${baseUrl}/setup-account?token=${token}`;
      
      await sendInvitationEmail({
        email: user.email,
        name: user.name,
        role: user.role,
        invitationUrl,
        invitedBy: currentUser.name || 'Team Administrator',
      });

      return new Response(JSON.stringify({ 
        message: 'Invitation resent successfully',
        invitationSent: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (emailError) {
      console.error('Error resending invitation email:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to resend invitation email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error resending invitation:', error);
    return new Response(JSON.stringify({ error: 'Failed to resend invitation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
