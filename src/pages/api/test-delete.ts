import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers, projectTeams, taskCollaborations } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async () => {
  console.log('=== TEST DELETE ENDPOINT ===');
  
  try {
    const teamId = 7; // Hardcoded for testing
    console.log('Testing deletion of team:', teamId);
    
    // Check if team exists
    console.log('Checking if team exists...');
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      console.log('Team not found');
      return new Response(JSON.stringify({
        success: false,
        message: 'Team not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Team found:', { id: team.id, name: team.name });
    
    // Delete in correct order to avoid foreign key constraints
    console.log('Step 1: Deleting task collaborations...');
    await db.delete(taskCollaborations).where(eq(taskCollaborations.teamId, teamId));
    console.log('Task collaborations deleted');
    
    console.log('Step 2: Deleting project teams...');
    await db.delete(projectTeams).where(eq(projectTeams.teamId, teamId));
    console.log('Project teams deleted');
    
    console.log('Step 3: Deleting team members...');
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    console.log('Team members deleted');
    
    console.log('Step 4: Deleting team...');
    await db.delete(teams).where(eq(teams.id, teamId));
    console.log('Team deleted');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test deletion successful'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== TEST DELETE FAILED ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Test deletion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
