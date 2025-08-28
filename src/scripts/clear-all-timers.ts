import 'dotenv/config';
import { db } from '../db/index';
import { timeEntries } from '../db/schema';
import { isNull, sql, and } from 'drizzle-orm';

async function clearAllTimers() {
  try {
    console.log('🗑️  Clearing all ongoing timers...');
    
    // Delete all time entries that don't have an end time (ongoing timers)
    // Exclude manual duration entries (entries with durationManual but no endTime)
    const deletedTimers = await db.delete(timeEntries)
      .where(
        and(
          isNull(timeEntries.endTime),
          isNull(timeEntries.durationManual), // Exclude manual duration entries
          sql`${timeEntries.startTime} IS NOT NULL` // Only include entries with actual start times
        )
      )
      .returning();
    
    console.log(`✅ Successfully cleared ${deletedTimers.length} ongoing timers`);
    
    if (deletedTimers.length > 0) {
      console.log('Deleted timers:');
      deletedTimers.forEach(timer => {
        console.log(`  - Timer ID: ${timer.id}, User ID: ${timer.userId}, Task ID: ${timer.taskId}, Started: ${timer.startTime}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing timers:', error);
    process.exit(1);
  }
}

// Run the script
clearAllTimers();
