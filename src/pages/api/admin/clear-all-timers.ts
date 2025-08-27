import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { timeEntries } from '../../../db/schema';
import { isNull } from 'drizzle-orm';
import { requireRole } from '../../../utils/session';

// DELETE: Clear all ongoing timers (time entries without end times)
export const DELETE: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole('admin', '/admin')(context) as any;
    
    console.log('Clearing all ongoing timers...');

    // Delete all time entries that don't have an end time (ongoing timers)
    const deletedTimers = await db.delete(timeEntries)
      .where(isNull(timeEntries.endTime))
      .returning();

    console.log(`Deleted ${deletedTimers.length} ongoing timers`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully cleared ${deletedTimers.length} ongoing timers`,
      deletedCount: deletedTimers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error clearing all timers:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
