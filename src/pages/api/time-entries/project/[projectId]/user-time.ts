import { db } from '../../../../../db/index';
import { timeEntries } from '../../../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSessionUser } from '../../../../../utils/session';

export async function GET({ params, request }: { params: { projectId: string }, request: Request }) {
  try {
    // Get current user
    const currentUser = await getSessionUser({ request } as any);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not authenticated',
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const projectId = parseInt(params.projectId);
    if (isNaN(projectId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid project ID',
        error: 'Project ID must be a number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get time entries for this project filtered by current user only
    const projectTimeEntries = await db.query.timeEntries.findMany({
      where: and(
        eq(timeEntries.projectId, projectId),
        eq(timeEntries.userId, currentUser.id), // Filter by current user
        // Exclude ongoing timers
        sql`NOT (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.endTime} IS NULL AND ${timeEntries.durationManual} IS NULL)`
      ),
      with: {
        user: true,
        project: true
      }
    });

    // Calculate total hours
    let totalSeconds = 0;
    for (const entry of projectTimeEntries) {
      if (entry.durationManual) {
        // Manual duration entry (stored in seconds)
        totalSeconds += entry.durationManual;
      } else if (entry.startTime && entry.endTime) {
        // Timer-based entry
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        const durationMs = end.getTime() - start.getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        totalSeconds += durationSeconds;
      }
    }

    // Convert to hours and format
    const totalHours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const remainingMinutes = Math.floor(remainingSeconds / 60);

    let totalTime = "0h";
    if (totalHours > 0) {
      totalTime = `${totalHours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    } else if (remainingMinutes > 0) {
      totalTime = `${remainingMinutes}m`;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User time retrieved successfully',
      data: {
        totalTime,
        totalSeconds,
        totalHours,
        remainingMinutes,
        entryCount: projectTimeEntries.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error retrieving user time:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to retrieve user time',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
