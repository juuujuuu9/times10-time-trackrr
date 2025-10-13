import { db } from '../../../../../db/index';
import { teams, teamMembers as teamMembersTable } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../utils/session';

export async function PUT(Astro: any) {
  try {
    // Check authentication
    const currentUser = await getSessionUser(Astro);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team ID from URL
    const teamId = parseInt(Astro.params.id);
    if (isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });

    if (!team) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await Astro.request.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'memberIds must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate member IDs are numbers
    const validMemberIds = memberIds.filter(id => typeof id === 'number' && !isNaN(id));
    
    // Remove all existing team members
    await db.delete(teamMembersTable).where(eq(teamMembersTable.teamId, teamId));

    // Add new team members
    if (validMemberIds.length > 0) {
      const newMembers = validMemberIds.map(userId => ({
        teamId: teamId,
        userId: userId,
        role: 'member',
        joinedAt: new Date()
      }));

      await db.insert(teamMembersTable).values(newMembers);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Team members updated successfully',
      data: {
        teamId: teamId,
        memberCount: validMemberIds.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating team members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
