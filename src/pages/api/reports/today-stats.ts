import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { timeEntries, users, projects, tasks, clients } from '../../../db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    
    // Calculate date range for today
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Get time entries for this user
    const simpleEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt
      })
      .from(timeEntries)
      .where(eq(timeEntries.userId, parseInt(userId || '0')))
      .limit(10);
    
    // Filter entries for today and calculate total hours
    const todayEntries = simpleEntries.filter(entry => {
      const entryDate = entry.startTime || entry.createdAt;
      if (!entryDate) return false;
      
      const entryDateObj = new Date(entryDate);
      return entryDateObj >= startDate && entryDateObj <= endDate;
    });

    // Calculate total seconds for today's entries
    const totalSeconds = todayEntries.reduce((total, entry) => {
      let duration = 0;
      if (entry.endTime && entry.startTime) {
        duration = Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000);
      } else if (entry.durationManual) {
        duration = entry.durationManual;
      }
      return total + duration;
    }, 0);


    return new Response(JSON.stringify({
      success: true,
      data: {
        totalHours: totalSeconds,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching today stats:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch today stats',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
