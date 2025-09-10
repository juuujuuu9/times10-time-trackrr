import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { users, sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../utils/auth';
import { createInvitationToken } from '../../../utils/invitation';
import { sendInvitationEmail } from '../../../utils/email';

export const GET: APIRoute = async () => {
  try {
    const allUsers = await db.select().from(users);
    return new Response(JSON.stringify(allUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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

    // Only admins can invite users
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only administrators can invite team members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, email, role, status, payRate, password, invitedBy } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      const user = existingUser[0];
      
      // If user exists but is invited, we can resend the invitation
      if (user.status === 'invited') {
        try {
          // Create a new invitation token
          const token = await createInvitationToken(email);
          
          // Send invitation email
          const baseUrl = process.env.PUBLIC_SITE_URL || process.env.BASE_URL || 'https://trackr.times10.net';
          const invitationUrl = `${baseUrl}/setup-account?token=${token}`;
          
          await sendInvitationEmail({
            email,
            name: user.name,
            role: user.role,
            invitationUrl,
            invitedBy: invitedBy || 'Team Administrator',
          });

          return new Response(JSON.stringify({ 
            ...user, 
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
      }
      
      // If user exists and is active, return error
      return new Response(JSON.stringify({ error: 'User with this email already exists and is active' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If password is provided, create user immediately
    if (password) {
      const hashedPassword = await hashPassword(password);
      const newUser = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        status: status || 'active',
        payRate: payRate || '0.00',
      }).returning();

      return new Response(JSON.stringify(newUser[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no password, create invitation
    try {
      // Create invitation token
      const token = await createInvitationToken(email);
      
      // Create user with temporary password (will be changed during setup)
      const tempPassword = await hashPassword('temp_' + Math.random().toString(36).substring(2));
      const newUser = await db.insert(users).values({
        name,
        email,
        password: tempPassword,
        role: role || 'user',
        status: 'invited', // New status for invited users
        payRate: payRate || '0.00',
      }).returning();

      // Send invitation email
      const baseUrl = process.env.PUBLIC_SITE_URL || process.env.BASE_URL || 'https://trackr.times10.net';
      const invitationUrl = `${baseUrl}/setup-account?token=${token}`;
      
      await sendInvitationEmail({
        email,
        name,
        role: role || 'user',
        invitationUrl,
        invitedBy: invitedBy || 'Team Administrator',
      });

      return new Response(JSON.stringify({ 
        ...newUser[0], 
        message: 'Invitation sent successfully',
        invitationSent: true 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (dbError: any) {
      console.error('Error creating user or sending invitation:', dbError);
      
      // Check if it's a duplicate email error
      if (dbError.code === '23505' && dbError.constraint === 'users_email_unique') {
        return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // If it's an email error, try to clean up the user if it was created
      if (dbError.message && dbError.message.includes('Failed to send invitation email')) {
        try {
          await db.delete(users).where(eq(users.email, email));
        } catch (cleanupError) {
          console.error('Error cleaning up user after email failure:', cleanupError);
        }
        return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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

    // Only admins can update users
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only administrators can update team members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, name, email, role, status, payRate, password } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updateData: any = { 
      updatedAt: new Date() 
    };

    // Only update fields if they are provided
    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (role !== undefined) {
      updateData.role = role;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (payRate !== undefined) {
      updateData.payRate = payRate;
    }
    if (password !== undefined) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (updatedUser.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedUser[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 