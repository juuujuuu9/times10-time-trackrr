import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers as teamMembersTable, users } from '../../db/schema';
import { eq, and, count, desc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Testing collaborations page logic...');
    
    // Test 1: Get all teams (exact same query as collaborations page)
    console.log('📊 Testing teams query...');
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        archived: teams.archived
      })
      .from(teams)
      .where(eq(teams.archived, false))
      .orderBy(desc(teams.createdAt));
    
    console.log(`✅ Teams query successful: ${teamsData.length} teams found`);
    
    // Test 2: Get member counts (exact same query as collaborations page)
    console.log('👥 Testing member counts query...');
    const memberCounts = await db
      .select({
        teamId: teamMembersTable.teamId,
        memberCount: count(teamMembersTable.userId)
      })
      .from(teamMembersTable)
      .groupBy(teamMembersTable.teamId);
    
    console.log(`✅ Member counts query successful: ${memberCounts.length} team-member relationships found`);
    
    // Test 3: Get team creators (exact same query as collaborations page)
    console.log('👤 Testing team creators query...');
    const teamCreators = await db
      .select({
        teamId: teams.id,
        creatorName: users.name,
        creatorEmail: users.email
      })
      .from(teams)
      .innerJoin(users, eq(teams.createdBy, users.id))
      .where(eq(teams.archived, false));
    
    console.log(`✅ Team creators query successful: ${teamCreators.length} creators found`);
    
    // Test 4: Combine data (exact same logic as collaborations page)
    console.log('🔄 Testing data combination...');
    const memberCountMap = new Map();
    memberCounts.forEach(mc => {
      memberCountMap.set(mc.teamId, mc.memberCount);
    });
    
    const allTeams = teamsData.map(team => ({
      ...team,
      memberCount: memberCountMap.get(team.id) || 0
    }));
    
    console.log(`✅ Data combination successful: ${allTeams.length} teams with member counts`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Collaborations page logic is working correctly',
      data: {
        teamsCount: teamsData.length,
        memberCountsCount: memberCounts.length,
        creatorsCount: teamCreators.length,
        allTeamsCount: allTeams.length,
        teams: allTeams.map(team => ({
          id: team.id,
          name: team.name,
          memberCount: team.memberCount
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Collaborations page logic failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
