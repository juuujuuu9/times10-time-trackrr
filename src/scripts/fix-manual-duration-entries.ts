import { db } from '../db';
import { timeEntries } from '../db/schema';
import { and, isNotNull, isNull, sql } from 'drizzle-orm';

async function fixManualDurationEntries() {
  console.log('🔧 Starting fix for manual duration entries...');
  
  try {
    // Find all entries that have durationManual but also have startTime and endTime
    // These are the problematic entries that were created with the old logic
    const problematicEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNotNull(timeEntries.startTime),
          isNotNull(timeEntries.endTime)
        )
      );

    console.log(`Found ${problematicEntries.length} problematic manual duration entries`);

    if (problematicEntries.length === 0) {
      console.log('✅ No problematic entries found. All manual duration entries are already correct.');
      return;
    }

    // Update these entries to have null startTime and endTime
    const updateResult = await db
      .update(timeEntries)
      .set({
        startTime: null,
        endTime: null,
        updatedAt: new Date()
      })
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNotNull(timeEntries.startTime),
          isNotNull(timeEntries.endTime)
        )
      );

    console.log(`✅ Fixed ${problematicEntries.length} manual duration entries`);
    console.log('Manual duration entries now have startTime: null and endTime: null');

    // Verify the fix
    const remainingProblematic = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNotNull(timeEntries.startTime),
          isNotNull(timeEntries.endTime)
        )
      );

    if (remainingProblematic.length === 0) {
      console.log('✅ Verification successful: No more problematic entries found');
    } else {
      console.log(`❌ Warning: ${remainingProblematic.length} problematic entries still remain`);
    }

  } catch (error) {
    console.error('❌ Error fixing manual duration entries:', error);
  }
}

// Run the fix
fixManualDurationEntries()
  .then(() => {
    console.log('🎉 Manual duration entries fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
