import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { teams, teamMembers, tasks } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export const DELETE: APIRoute = async (context) => {
  try {
    console.log('DELETE collaboration API called');
    
    // Test database connection
    console.log('Testing database connection...');
    try {
      await db.query.teams.findFirst();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get current user and verify admin access
    console.log('Getting session user...');
    const currentUser = await getSessionUser(context);
    console.log('Current user:', currentUser ? { id: currentUser.id, role: currentUser.role } : 'null');
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      console.log('Unauthorized access - user role:', currentUser?.role);
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Insufficient permissions'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team ID from params
    const teamId = context.params.id;
    console.log('Team ID from params:', teamId);
    
    if (!teamId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Team ID is required',
        error: 'Missing team ID parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate team ID is a number
    const parsedTeamId = parseInt(teamId);
    console.log('Parsed team ID:', parsedTeamId);
    
    if (isNaN(parsedTeamId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid team ID format',
        error: 'Team ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if team exists
    console.log('Checking if team exists...');
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, parsedTeamId)
    });
    console.log('Existing team:', existingTeam ? { id: existingTeam.id, name: existingTeam.name } : 'null');

    if (!existingTeam) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Team not found',
        error: 'Team does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for tasks associated with this team first
    console.log('Step 3: Checking for associated tasks...');
    const associatedTasks = await db.query.tasks.findMany({
      where: eq(tasks.teamId, parsedTeamId)
    });
    console.log('Associated tasks found:', associatedTasks.length);
    
    if (associatedTasks.length > 0) {
      console.log('Step 3a: Removing team association from tasks...');
      try {
        // Remove team association from tasks (set teamId to null)
        await db.update(tasks)
          .set({ teamId: null, updatedAt: new Date() })
          .where(eq(tasks.teamId, parsedTeamId));
        console.log('Team association removed from tasks');
      } catch (taskError) {
        console.error('Error removing team association from tasks:', taskError);
        throw taskError;
      }
    }

    console.log('Step 4: Deleting team members...');
    let deletedMembers = [];
    try {
      deletedMembers = await db.delete(teamMembers).where(eq(teamMembers.teamId, parsedTeamId)).returning();
      console.log('Team members deleted:', deletedMembers.length);
    } catch (memberError) {
      console.error('Error deleting team members:', memberError);
      throw memberError;
    }

    console.log('Step 5: Deleting team...');
    try {
      const deletedTeam = await db.delete(teams).where(eq(teams.id, parsedTeamId)).returning();
      console.log('Team deleted successfully:', deletedTeam.length);
    } catch (teamError) {
      console.error('Error deleting team:', teamError);
      throw teamError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Collaboration deleted successfully',
      data: {
        deletedTeamId: parsedTeamId,
        deletedTeamName: existingTeam.name,
        disassociatedTasks: associatedTasks.length,
        deletedMembers: deletedMembers.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
