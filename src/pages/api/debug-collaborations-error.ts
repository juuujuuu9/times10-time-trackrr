import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers as teamMembersTable, users } from '../../db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async (context) => {
  try {
    console.log('🔍 DEBUG: Starting collaborations debug endpoint...');
    
    // Test 1: Check database connection
    console.log('🔍 DEBUG: Testing database connection...');
    const userCount = await db.select({ count: count() }).from(users);
    console.log(`✅ Database connection successful: ${userCount[0].count} users`);
    
    // Test 2: Check if we can get session user
    console.log('🔍 DEBUG: Testing session user...');
    const currentUser = await getSessionUser(context);
    console.log('🔍 DEBUG: Current user:', currentUser ? { id: currentUser.id, role: currentUser.role } : 'null');
    
    // Test 3: Try the exact teams query from collaborations page
    console.log('🔍 DEBUG: Testing teams query...');
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
    
    console.log(`✅ Teams query successful: ${teamsData.length} teams`);
    
    // Test 4: Try the exact member counts query
    console.log('🔍 DEBUG: Testing member counts query...');
    const memberCounts = await db
      .select({
        teamId: teamMembersTable.teamId,
        memberCount: count(teamMembersTable.userId)
      })
      .from(teamMembersTable)
      .groupBy(teamMembersTable.teamId);
    
    console.log(`✅ Member counts query successful: ${memberCounts.length} relationships`);
    
    // Test 5: Try the exact team creators query
    console.log('🔍 DEBUG: Testing team creators query...');
    const teamCreators = await db
      .select({
        teamId: teams.id,
        creatorName: users.name,
        creatorEmail: users.email
      })
      .from(teams)
      .innerJoin(users, eq(teams.createdBy, users.id))
      .where(eq(teams.archived, false));
    
    console.log(`✅ Team creators query successful: ${teamCreators.length} creators`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'All collaborations queries are working correctly',
      data: {
        userCount: userCount[0].count,
        teamsCount: teamsData.length,
        memberCountsCount: memberCounts.length,
        teamCreatorsCount: teamCreators.length,
        currentUser: currentUser ? { id: currentUser.id, role: currentUser.role } : null
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Error in collaborations debug:', error);
    console.error('❌ DEBUG: Error message:', error.message);
    console.error('❌ DEBUG: Error stack:', error.stack);
    
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
