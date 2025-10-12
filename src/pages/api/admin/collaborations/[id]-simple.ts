import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { teams, teamMembers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async (context) => {
  try {
    console.log('=== SIMPLE DELETE COLLABORATION ===');
    console.log('Team ID from params:', context.params.id);
    
    const teamId = parseInt(context.params.id || '0');
    if (isNaN(teamId) || teamId <= 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Attempting to delete team:', teamId);
    
    // Check if team exists first
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!existingTeam) {
      console.log('Team not found');
      return new Response(JSON.stringify({
        success: false,
        message: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Team found:', { id: existingTeam.id, name: existingTeam.name });
    
    // Delete team members first
    console.log('Deleting team members...');
    const deletedMembers = await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    console.log('Team members deleted');
    
    // Delete the team
    console.log('Deleting team...');
    const deletedTeam = await db.delete(teams).where(eq(teams.id, teamId));
    console.log('Team deleted');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Collaboration deleted successfully',
      data: {
        deletedTeamId: teamId,
        deletedTeamName: existingTeam.name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== SIMPLE DELETE FAILED ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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
