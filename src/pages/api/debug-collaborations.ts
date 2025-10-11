import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers as teamMembersTable, users } from '../../db/schema';
import { eq, and, count, desc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Debugging collaborations page logic...');
    
    // Test 1: Check if we can connect to database
    console.log('📊 Testing database connection...');
    const userCount = await db.select({ count: count() }).from(users);
    console.log(`✅ Database connection successful: ${userCount[0].count} users found`);
    
    // Test 2: Check if teams table exists and is accessible
    console.log('👥 Testing teams table...');
    const teamsCount = await db.select({ count: count() }).from(teams);
    console.log(`✅ Teams table accessible: ${teamsCount[0].count} teams found`);
    
    // Test 3: Check if team_members table exists and is accessible
    console.log('👤 Testing team_members table...');
    const membersCount = await db.select({ count: count() }).from(teamMembersTable);
    console.log(`✅ Team members table accessible: ${membersCount[0].count} members found`);
    
    // Test 4: Try the exact teams query from collaborations page
    console.log('🔍 Testing teams query (exact same as collaborations page)...');
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
    teamsData.forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.id}, Created: ${team.createdAt})`);
    });
    
    // Test 5: Try the exact member counts query from collaborations page
    console.log('🔍 Testing member counts query (exact same as collaborations page)...');
    const memberCounts = await db
      .select({
        teamId: teamMembersTable.teamId,
        memberCount: count(teamMembersTable.userId)
      })
      .from(teamMembersTable)
      .groupBy(teamMembersTable.teamId);
    
    console.log(`✅ Member counts query successful: ${memberCounts.length} team-member relationships found`);
    memberCounts.forEach(mc => {
      console.log(`  - Team ${mc.teamId}: ${mc.memberCount} members`);
    });
    
    // Test 6: Try the exact team creators query from collaborations page
    console.log('🔍 Testing team creators query (exact same as collaborations page)...');
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
    teamCreators.forEach(creator => {
      console.log(`  - Team ${creator.teamId}: ${creator.creatorName} (${creator.creatorEmail})`);
    });
    
    // Test 7: Try the data combination logic
    console.log('🔍 Testing data combination logic...');
    const memberCountMap = new Map();
    memberCounts.forEach(mc => {
      memberCountMap.set(mc.teamId, mc.memberCount);
    });
    
    const allTeams = teamsData.map(team => ({
      ...team,
      memberCount: memberCountMap.get(team.id) || 0
    }));
    
    console.log(`✅ Data combination successful: ${allTeams.length} teams with member counts`);
    allTeams.forEach(team => {
      console.log(`  - ${team.name}: ${team.memberCount} members`);
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'All collaborations page logic is working correctly',
      data: {
        userCount: userCount[0].count,
        teamsCount: teamsCount[0].count,
        membersCount: membersCount[0].count,
        teamsData: teamsData.length,
        memberCounts: memberCounts.length,
        teamCreators: teamCreators.length,
        allTeams: allTeams.length,
        teams: allTeams.map(team => ({
          id: team.id,
          name: team.name,
          memberCount: team.memberCount,
          createdBy: team.createdBy
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Collaborations debug failed:', error);
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
