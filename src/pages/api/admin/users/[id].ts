import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { users, timeEntries, taskAssignments } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = parseInt(id);

    // First, delete related time entries
    await db
      .delete(timeEntries)
      .where(eq(timeEntries.userId, userId));

    // Then, delete related task assignments
    await db
      .delete(taskAssignments)
      .where(eq(taskAssignments.userId, userId));

    // Finally, delete the user
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
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
