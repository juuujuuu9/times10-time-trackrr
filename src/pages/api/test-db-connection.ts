import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    
    // Test 1: Basic database connection
    console.log('1. Testing basic database connection...');
    const connectionTest = await db.query.teams.findFirst({ limit: 1 });
    console.log('✓ Database connection successful');
    
    // Test 2: Check if teams table exists and has data
    console.log('2. Testing teams table...');
    const allTeams = await db.query.teams.findMany({ limit: 5 });
    console.log(`✓ Teams table accessible, found ${allTeams.length} teams:`, allTeams.map(t => ({ id: t.id, name: t.name })));
    
    // Test 3: Check if team_members table exists
    console.log('3. Testing team_members table...');
    const allMembers = await db.query.teamMembers.findMany({ limit: 5 });
    console.log(`✓ Team_members table accessible, found ${allMembers.length} members:`, allMembers.map(m => ({ teamId: m.teamId, userId: m.userId })));
    
    // Test 4: Try to find team with ID 7 specifically
    console.log('4. Testing specific team ID 7...');
    const team7 = await db.query.teams.findFirst({
      where: eq(teams.id, 7)
    });
    console.log('Team 7 found:', team7 ? { id: team7.id, name: team7.name, archived: team7.archived } : 'NOT FOUND');
    
    // Test 5: Check team members for team 7
    if (team7) {
      console.log('5. Testing team members for team 7...');
      const team7Members = await db.query.teamMembers.findMany({
        where: eq(teamMembers.teamId, 7)
      });
      console.log(`Team 7 has ${team7Members.length} members:`, team7Members.map(m => ({ userId: m.userId, role: m.role })));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection test completed successfully',
      data: {
        teamsCount: allTeams.length,
        membersCount: allMembers.length,
        team7: team7 ? { id: team7.id, name: team7.name, archived: team7.archived } : null,
        team7MembersCount: team7 ? (await db.query.teamMembers.findMany({ where: eq(teamMembers.teamId, 7) })).length : 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== DATABASE CONNECTION TEST FAILED ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
