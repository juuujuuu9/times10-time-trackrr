import { db } from '../db';
import { projectTeams, teamMembers, teams, projects, clients, timeEntries, users } from '../db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { userHasTeamAccessToProject, getUserTeamDashboards, userIsTeamLeadForProject } from '../utils/teamAccess';

export interface TeamDashboardData {
  teamId: number;
  teamName: string;
  teamDescription: string;
  userRole: string;
  projects: Array<{
    projectId: number;
    projectName: string;
    clientName: string;
    totalHours: number;
    totalCost: number;
    memberCount: number;
    recentActivity: Array<{
      userId: number;
      userName: string;
      action: string;
      timestamp: Date;
    }>;
  }>;
  teamStats: {
    totalHours: number;
    totalCost: number;
    activeMembers: number;
    activeProjects: number;
  };
}

export class TeamDashboardService {
  /**
   * Get team dashboard data for a specific team
   * @param teamId - The team ID
   * @param userId - The user requesting the data
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Promise<TeamDashboardData | null> - Team dashboard data or null if no access
   */
  static async getTeamDashboard(
    teamId: number, 
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<TeamDashboardData | null> {
    try {
      // Check if user is member of the team
      const teamMembership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      });

      if (!teamMembership) {
        return null; // User is not a member of this team
      }

      // Get team info
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, teamId)
      });

      if (!team) {
        return null;
      }

      // Get projects assigned to this team
      const teamProjects = await db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          clientName: clients.name,
          clientId: clients.id
        })
        .from(projectTeams)
        .innerJoin(projects, eq(projectTeams.projectId, projects.id))
        .innerJoin(clients, eq(projects.clientId, clients.id))
        .where(and(
          eq(projectTeams.teamId, teamId),
          eq(projects.archived, false),
          eq(clients.archived, false)
        ));

      // Get team members
      const teamMembersList = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userRole: teamMembers.role
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, teamId));

      // Calculate stats for each project
      const projectsWithStats = await Promise.all(
        teamProjects.map(async (project) => {
          // Get time entries for this project from team members
          const timeEntriesQuery = db
            .select({
              totalHours: sql<number>`COALESCE(SUM(
                CASE 
                  WHEN ${timeEntries.durationManual} IS NOT NULL 
                  THEN ${timeEntries.durationManual}
                  WHEN ${timeEntries.endTime} IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
                  ELSE 0
                END
              ), 0)`.as('total_hours'),
              totalCost: sql<number>`COALESCE(SUM(
                CASE 
                  WHEN ${timeEntries.durationManual} IS NOT NULL 
                  THEN ROUND((${timeEntries.durationManual} / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
                  WHEN ${timeEntries.endTime} IS NOT NULL 
                  THEN ROUND((EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
                  ELSE 0
                END
              ), 0)`.as('total_cost')
            })
            .from(timeEntries)
            .innerJoin(users, eq(timeEntries.userId, users.id))
            .where(and(
              eq(timeEntries.projectId, project.projectId),
              sql`${timeEntries.userId} IN (${teamMembersList.map(m => m.userId).join(',')})`
            ));

          // Add date filtering if provided
          if (startDate && endDate) {
            timeEntriesQuery.where(and(
              eq(timeEntries.projectId, project.projectId),
              sql`${timeEntries.userId} IN (${teamMembersList.map(m => m.userId).join(',')})`,
              sql`(
                (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
                OR 
                (${timeEntries.startTime} IS NULL AND ${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
              )`
            ));
          }

          const stats = await timeEntriesQuery;

          // Get recent activity (last 10 time entries for this project)
          const recentActivity = await db
            .select({
              userId: users.id,
              userName: users.name,
              action: sql<string>`'time_entry'`.as('action'),
              timestamp: timeEntries.createdAt
            })
            .from(timeEntries)
            .innerJoin(users, eq(timeEntries.userId, users.id))
            .where(and(
              eq(timeEntries.projectId, project.projectId),
              sql`${timeEntries.userId} IN (${teamMembersList.map(m => m.userId).join(',')})`
            ))
            .orderBy(desc(timeEntries.createdAt))
            .limit(10);

          return {
            projectId: project.projectId,
            projectName: project.projectName,
            clientName: project.clientName,
            totalHours: stats[0]?.totalHours || 0,
            totalCost: stats[0]?.totalCost || 0,
            memberCount: teamMembersList.length,
            recentActivity: recentActivity
          };
        })
      );

      // Calculate overall team stats
      const totalHours = projectsWithStats.reduce((sum, project) => sum + project.totalHours, 0);
      const totalCost = projectsWithStats.reduce((sum, project) => sum + project.totalCost, 0);
      const activeMembers = teamMembersList.length;
      const activeProjects = projectsWithStats.length;

      return {
        teamId: team.id,
        teamName: team.name,
        teamDescription: team.description || '',
        userRole: teamMembership.role,
        projects: projectsWithStats,
        teamStats: {
          totalHours,
          totalCost,
          activeMembers,
          activeProjects
        }
      };

    } catch (error) {
      console.error('Error getting team dashboard:', error);
      return null;
    }
  }

  /**
   * Get all team dashboards accessible to a user
   * @param userId - The user ID
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Promise<TeamDashboardData[]> - Array of team dashboard data
   */
  static async getUserTeamDashboards(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<TeamDashboardData[]> {
    try {
      // Get all teams the user is a member of
      const userTeams = await db
        .select({
          teamId: teams.id
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teams.archived, false)
        ));

      // Get dashboard data for each team
      const teamDashboards = await Promise.all(
        userTeams.map(team => 
          this.getTeamDashboard(team.teamId, userId, startDate, endDate)
        )
      );

      // Filter out null results
      return teamDashboards.filter((dashboard): dashboard is TeamDashboardData => dashboard !== null);

    } catch (error) {
      console.error('Error getting user team dashboards:', error);
      return [];
    }
  }

  /**
   * Check if user can access a specific project's team dashboard
   * @param userId - The user ID
   * @param projectId - The project ID
   * @returns Promise<boolean> - True if user can access the project's team dashboard
   */
  static async canAccessProjectTeamDashboard(userId: number, projectId: number): Promise<boolean> {
    return await userHasTeamAccessToProject(userId, projectId);
  }
}
