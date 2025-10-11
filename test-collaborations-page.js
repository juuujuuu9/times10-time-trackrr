#!/usr/bin/env node

/**
 * Test Collaborations Page Logic
 * This script tests the exact same logic that the collaborations page uses
 */

import { db } from './src/db/index.ts';
import { teams, teamMembers as teamMembersTable, users } from './src/db/schema.ts';
import { eq, and, count, desc } from 'drizzle-orm';

console.log('🧪 Testing Collaborations Page Logic...');

async function testCollaborationsPage() {
  try {
    console.log('✅ Database connection established');
    
    // Test 1: Get all teams (exact same query as collaborations page)
    console.log('\n📊 Testing teams query...');
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
      console.log(`  - ${team.name} (ID: ${team.id})`);
    });
    
    // Test 2: Get member counts (exact same query as collaborations page)
    console.log('\n👥 Testing member counts query...');
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
    
    // Test 3: Get team creators (exact same query as collaborations page)
    console.log('\n👤 Testing team creators query...');
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
    
    // Test 4: Combine data (exact same logic as collaborations page)
    console.log('\n🔄 Testing data combination...');
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
    
    console.log('\n🎉 All collaborations page logic is working correctly!');
    console.log('The issue might be with the application deployment or environment variables.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Collaborations page logic failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testCollaborationsPage()
  .then(success => {
    if (success) {
      console.log('\n✅ Collaborations page logic is working');
      console.log('The 500 error might be due to deployment or environment issues.');
    } else {
      console.log('\n❌ Collaborations page logic has issues');
      console.log('This explains the 500 error on the live site.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });
