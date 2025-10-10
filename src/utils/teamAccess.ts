import { db } from '../db';
import { projectTeams, teamMembers, teams, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has team access to a project
 * @param userId - The user ID to check
 * @param projectId - The project ID to check access for
 * @returns Promise<boolean> - True if user has team access to the project
 */
export async function userHasTeamAccessToProject(userId: number, projectId: number): Promise<boolean> {
  try {
    // Check if user is member of any team assigned to this project
    const teamAccess = await db
      .select({
        teamId: teams.id,
        teamName: teams.name
      })
      .from(projectTeams)
      .innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .where(and(
        eq(projectTeams.projectId, projectId),
        eq(teamMembers.userId, userId)
      ))
      .limit(1);

    return teamAccess.length > 0;
  } catch (error) {
    console.error('Error checking team access:', error);
    return false;
  }
}

/**
 * Get all projects a user has team access to
 * @param userId - The user ID
 * @returns Promise<Array> - Array of projects with team access
 */
export async function getUserTeamProjects(userId: number) {
  try {
    const teamProjects = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        clientName: projects.clientName,
        teamId: teams.id,
        teamName: teams.name,
        userRole: teamMembers.role
      })
      .from(projectTeams)
      .innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .innerJoin(projects, eq(projectTeams.projectId, projects.id))
      .where(and(
        eq(teamMembers.userId, userId),
        eq(projects.archived, false)
      ));

    return teamProjects;
  } catch (error) {
    console.error('Error fetching user team projects:', error);
    return [];
  }
}

/**
 * Get all teams a user is a member of
 * @param userId - The user ID
 * @returns Promise<Array> - Array of teams the user is a member of
 */
export async function getUserTeams(userId: number) {
  try {
    const userTeams = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        teamDescription: teams.description,
        userRole: teamMembers.role,
        joinedAt: teamMembers.joinedAt
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(
        eq(teamMembers.userId, userId),
        eq(teams.archived, false)
      ));

    return userTeams;
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
}

/**
 * Get team dashboard data for a user
 * @param userId - The user ID
 * @returns Promise<Object> - Team dashboard data
 */
export async function getUserTeamDashboards(userId: number) {
  try {
    // Get user's teams
    const userTeams = await getUserTeams(userId);
    
    // Get projects for each team
    const teamProjects = await getUserTeamProjects(userId);
    
    // Group projects by team
    const teamDashboards = userTeams.map(team => {
      const teamProjectsList = teamProjects.filter(project => project.teamId === team.teamId);
      
      return {
        teamId: team.teamId,
        teamName: team.teamName,
        teamDescription: team.teamDescription,
        userRole: team.userRole,
        joinedAt: team.joinedAt,
        projects: teamProjectsList.map(project => ({
          projectId: project.projectId,
          projectName: project.projectName,
          clientName: project.clientName
        }))
      };
    });

    return teamDashboards;
  } catch (error) {
    console.error('Error fetching user team dashboards:', error);
    return [];
  }
}

/**
 * Check if a user is a team lead for any team assigned to a project
 * @param userId - The user ID
 * @param projectId - The project ID
 * @returns Promise<boolean> - True if user is a team lead for the project
 */
export async function userIsTeamLeadForProject(userId: number, projectId: number): Promise<boolean> {
  try {
    const teamLeadAccess = await db
      .select({
        teamId: teams.id,
        teamName: teams.name
      })
      .from(projectTeams)
      .innerJoin(teamMembers, eq(projectTeams.teamId, teamMembers.teamId))
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .where(and(
        eq(projectTeams.projectId, projectId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, 'lead')
      ))
      .limit(1);

    return teamLeadAccess.length > 0;
  } catch (error) {
    console.error('Error checking team lead access:', error);
    return false;
  }
}
