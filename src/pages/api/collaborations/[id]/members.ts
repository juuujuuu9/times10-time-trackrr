import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { teams, teamMembers as teamMembersTable, users } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/members - Get team members for a collaboration
export const GET: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team members with user details
    const teamMembers = await db
      .select({
        userId: teamMembersTable.userId,
        role: teamMembersTable.role,
        joinedAt: teamMembersTable.joinedAt,
        name: users.name,
        email: users.email
      })
      .from(teamMembersTable)
      .innerJoin(users, eq(teamMembersTable.userId, users.id))
      .where(eq(teamMembersTable.teamId, collaborationId));

    return new Response(JSON.stringify({
      success: true,
      data: teamMembers
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team members'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
