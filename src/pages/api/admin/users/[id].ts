import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users, timeEntries, taskAssignments, sessions, clients, slackUsers, invitationTokens } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = parseInt(id);

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

    // Require authentication
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent users from deleting themselves
    if (currentUser.id === userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admins can delete users
    if (currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only administrators can delete team members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete in order to avoid foreign key constraint violations
    
    // 1. Delete related time entries
    await db
      .delete(timeEntries)
      .where(eq(timeEntries.userId, userId));

    // 2. Delete related task assignments
    await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.userId, userId));

    // 3. Delete related Slack user links
    await db
      .delete(slackUsers)
      .where(eq(slackUsers.userId, userId));

    // 4. Delete related sessions
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));

    // 5. Delete any invitation tokens for this user's email
    const userToDelete = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userToDelete.length > 0) {
      await db
        .delete(invitationTokens)
        .where(eq(invitationTokens.email, userToDelete[0].email));
    }

    // 6. Delete clients created by this user (or set createdBy to null if you want to keep them)
    // For now, we'll delete them. If you want to keep clients, you'd need to update the schema
    await db
      .delete(clients)
      .where(eq(clients.createdBy, userId));

    // 7. Finally, delete the user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to delete user';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        errorMessage = 'Cannot delete user: They have associated data that needs to be handled first';
        statusCode = 409;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
