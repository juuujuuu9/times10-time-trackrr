import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { projects, tasks, timeEntries } from '../../../../db/schema';
import { eq, count, sql, and, gte, lt } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all projects
    const allProjects = await db
      .select({
        id: projects.id,
      })
      .from(projects);

    // Get statistics for each project
    const projectStats = await Promise.all(
      allProjects.map(async (project) => {
        // Get task count
        const taskCountResult = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));
        
        const taskCount = taskCountResult[0]?.count || 0;
        
        // Get total hours for current month using projectId directly
        const timeEntriesResult = await db
          .select({
            durationManual: timeEntries.durationManual,
            startTime: timeEntries.startTime,
            endTime: timeEntries.endTime,
            createdAt: timeEntries.createdAt,
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.projectId, project.id),
              // Filter by current month - check both startTime and createdAt for manual entries
              sql`(
                (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startOfMonth} AND ${timeEntries.startTime} <= ${endOfMonth})
                OR 
                (${timeEntries.durationManual} IS NOT NULL AND ${timeEntries.createdAt} >= ${startOfMonth} AND ${timeEntries.createdAt} <= ${endOfMonth})
              )`
            )
          );
        
        const totalHours = timeEntriesResult.reduce((sum, entry) => {
          if (entry.durationManual) {
            return sum + (entry.durationManual / 3600);
          } else if (entry.endTime && entry.startTime) {
            const duration = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
            return sum + (duration / (1000 * 3600));
          }
          return sum;
        }, 0);
        
        return {
          projectId: project.id,
          taskCount,
          totalHours,
        };
      })
    );

    return new Response(JSON.stringify(projectStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch project statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
