import { db } from '../db';
import { teams, teamMembers, projects, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { userHasTeamAccessToProject, getUserTeamDashboards } from '../utils/teamAccess';
import { TeamDashboardService } from '../services/TeamDashboardService';

/**
 * Test script to verify team assignment and access control functionality
 * Run with: npx tsx src/scripts/test-team-assignments.ts
 */
async function testTeamAssignments() {
  console.log('🧪 Testing Team Assignment and Access Control...\n');

  try {
    // 1. Get some existing users and projects
    const allUsers = await db.query.users.findMany({ limit: 3 });
    const allProjects = await db.query.projects.findMany({ limit: 2 });
    const allTeams = await db.query.teams.findMany({ limit: 2 });

    if (allUsers.length < 2 || allProjects.length < 2 || allTeams.length < 2) {
      console.log('❌ Need at least 2 users, 2 projects, and 2 teams for testing');
      return;
    }

    const user1 = allUsers[0];
    const user2 = allUsers[1];
    const project1 = allProjects[0];
    const project2 = allProjects[1];
    const team1 = allTeams[0];
    const team2 = allTeams[1];

    console.log(`👤 Testing with User 1: ${user1.name} (ID: ${user1.id})`);
    console.log(`👤 Testing with User 2: ${user2.name} (ID: ${user2.id})`);
    console.log(`📁 Testing with Project 1: ${project1.name} (ID: ${project1.id})`);
    console.log(`📁 Testing with Project 2: ${project2.name} (ID: ${project2.id})`);
    console.log(`👥 Testing with Team 1: ${team1.name} (ID: ${team1.id})`);
    console.log(`👥 Testing with Team 2: ${team2.name} (ID: ${team2.id})\n`);

    // 2. Test team membership
    console.log('🔍 Testing team membership...');
    
    // Check if users are already members of teams
    const user1TeamMemberships = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, user1.id)
    });
    
    const user2TeamMemberships = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, user2.id)
    });

    console.log(`User 1 is member of ${user1TeamMemberships.length} teams`);
    console.log(`User 2 is member of ${user2TeamMemberships.length} teams`);

    // If users aren't members of teams, add them
    if (user1TeamMemberships.length === 0) {
      await db.insert(teamMembers).values({
        teamId: team1.id,
        userId: user1.id,
        role: 'member'
      });
      console.log(`✅ Added User 1 to Team 1`);
    }

    if (user2TeamMemberships.length === 0) {
      await db.insert(teamMembers).values({
        teamId: team2.id,
        userId: user2.id,
        role: 'lead'
      });
      console.log(`✅ Added User 2 to Team 2`);
    }

    // 3. Test project-team assignments
    console.log('\n🔍 Testing project-team assignments...');
    
    // Check existing assignments (using direct relationship)
    const existingTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.projectId, project1.id),
        eq(teams.id, team1.id)
      )
    });

    if (!existingTeam) {
      await db.update(teams).set({
        projectId: project1.id
      }).where(eq(teams.id, team1.id));
      console.log(`✅ Assigned Team 1 to Project 1`);
    } else {
      console.log(`ℹ️  Team 1 already assigned to Project 1`);
    }

    // 4. Test access control
    console.log('\n🔍 Testing access control...');
    
    // Test user1 access to project1 (should have access)
    const user1HasAccessToProject1 = await userHasTeamAccessToProject(user1.id, project1.id);
    console.log(`User 1 has team access to Project 1: ${user1HasAccessToProject1 ? '✅ YES' : '❌ NO'}`);

    // Test user1 access to project2 (should not have access)
    const user1HasAccessToProject2 = await userHasTeamAccessToProject(user1.id, project2.id);
    console.log(`User 1 has team access to Project 2: ${user1HasAccessToProject2 ? '✅ YES' : '❌ NO'}`);

    // Test user2 access to project1 (should not have access)
    const user2HasAccessToProject1 = await userHasTeamAccessToProject(user2.id, project1.id);
    console.log(`User 2 has team access to Project 1: ${user2HasAccessToProject1 ? '✅ YES' : '❌ NO'}`);

    // 5. Test team dashboards
    console.log('\n🔍 Testing team dashboards...');
    
    const user1TeamDashboards = await getUserTeamDashboards(user1.id);
    console.log(`User 1 has access to ${user1TeamDashboards.length} team dashboards`);
    
    const user2TeamDashboards = await getUserTeamDashboards(user2.id);
    console.log(`User 2 has access to ${user2TeamDashboards.length} team dashboards`);

    // 6. Test team dashboard service
    console.log('\n🔍 Testing team dashboard service...');
    
    const team1Dashboard = await TeamDashboardService.getTeamDashboard(team1.id, user1.id);
    if (team1Dashboard) {
      console.log(`✅ Team 1 dashboard accessible to User 1`);
      console.log(`   - Team: ${team1Dashboard.teamName}`);
      console.log(`   - Projects: ${team1Dashboard.projects.length}`);
      console.log(`   - Total Hours: ${team1Dashboard.teamStats.totalHours}`);
      console.log(`   - Total Cost: $${team1Dashboard.teamStats.totalCost}`);
    } else {
      console.log(`❌ Team 1 dashboard not accessible to User 1`);
    }

    const team2Dashboard = await TeamDashboardService.getTeamDashboard(team2.id, user2.id);
    if (team2Dashboard) {
      console.log(`✅ Team 2 dashboard accessible to User 2`);
      console.log(`   - Team: ${team2Dashboard.teamName}`);
      console.log(`   - Projects: ${team2Dashboard.projects.length}`);
      console.log(`   - Total Hours: ${team2Dashboard.teamStats.totalHours}`);
      console.log(`   - Total Cost: $${team2Dashboard.teamStats.totalCost}`);
    } else {
      console.log(`❌ Team 2 dashboard not accessible to User 2`);
    }

    console.log('\n🎉 Team assignment and access control tests completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testTeamAssignments().then(() => {
  console.log('\n✅ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
