import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { teams, teamMembers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async (context) => {
  console.log('=== MINIMAL DELETE TEST ===');
  console.log('Context params:', context.params);
  console.log('Team ID:', context.params.id);
  
  try {
    const teamId = parseInt(context.params.id || '0');
    console.log('Parsed team ID:', teamId);
    
    if (isNaN(teamId) || teamId <= 0) {
      console.log('Invalid team ID');
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Starting deletion process...');
    
    // Step 1: Check if team exists
    console.log('Step 1: Checking if team exists...');
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    console.log('Team found:', team ? 'YES' : 'NO');
    
    if (!team) {
      console.log('Team not found, returning 404');
      return new Response(JSON.stringify({
        success: false,
        message: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Team details:', { id: team.id, name: team.name });
    
    // Step 2: Delete team members
    console.log('Step 2: Deleting team members...');
    try {
      const result = await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
      console.log('Team members deletion result:', result);
      console.log('Team members deleted successfully');
    } catch (memberError) {
      console.error('Error deleting team members:', memberError);
      throw memberError;
    }
    
    // Step 3: Delete team
    console.log('Step 3: Deleting team...');
    try {
      const result = await db.delete(teams).where(eq(teams.id, teamId));
      console.log('Team deletion result:', result);
      console.log('Team deleted successfully');
    } catch (teamError) {
      console.error('Error deleting team:', teamError);
      throw teamError;
    }
    
    console.log('=== DELETION COMPLETED SUCCESSFULLY ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Collaboration deleted successfully',
      data: {
        deletedTeamId: teamId,
        deletedTeamName: team.name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== MINIMAL DELETE FAILED ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
