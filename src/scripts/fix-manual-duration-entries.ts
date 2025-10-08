import { db } from '../db';
import { timeEntries } from '../db/schema';
import { and, isNotNull, isNull } from 'drizzle-orm';

/**
 * Fix manual duration entries that have incorrect startTime values
 * Manual duration entries should have startTime: null and endTime: null
 */
async function fixManualDurationEntries() {
  try {
    console.log('🔍 Finding manual duration entries with incorrect startTime values...');
    
    // Find entries that have durationManual but also have startTime (incorrect)
    const incorrectEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNotNull(timeEntries.startTime)
        )
      );

    console.log(`📊 Found ${incorrectEntries.length} manual duration entries with incorrect startTime values`);

    if (incorrectEntries.length === 0) {
      console.log('✅ No manual duration entries need fixing');
      return;
    }

    // Show details of entries that will be fixed
    console.log('\n📋 Entries to be fixed:');
    incorrectEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ID: ${entry.id}, User: ${entry.userId}, Project: ${entry.projectId}`);
      console.log(`     Duration: ${entry.durationManual}s (${Math.round(entry.durationManual! / 3600 * 100) / 100}h)`);
      console.log(`     Current startTime: ${entry.startTime}`);
      console.log(`     Current endTime: ${entry.endTime}`);
      console.log(`     Created: ${entry.createdAt}`);
      console.log('');
    });

    // Fix the entries by setting startTime and endTime to null
    console.log('🔧 Fixing manual duration entries...');
    
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
          isNotNull(timeEntries.startTime)
        )
      )
      .returning();

    console.log(`✅ Fixed ${updateResult.length} manual duration entries`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingIncorrect = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNotNull(timeEntries.startTime)
        )
      );

    if (remainingIncorrect.length === 0) {
      console.log('✅ All manual duration entries have been fixed successfully');
    } else {
      console.log(`❌ ${remainingIncorrect.length} entries still need fixing`);
    }

    // Show final statistics
    const allManualEntries = await db
      .select()
      .from(timeEntries)
      .where(isNotNull(timeEntries.durationManual));

    const correctManualEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          isNotNull(timeEntries.durationManual),
          isNull(timeEntries.startTime),
          isNull(timeEntries.endTime)
        )
      );

    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total manual duration entries: ${allManualEntries.length}`);
    console.log(`   Correctly formatted entries: ${correctManualEntries.length}`);
    console.log(`   Entries fixed: ${updateResult.length}`);

  } catch (error) {
    console.error('❌ Error fixing manual duration entries:', error);
    throw error;
  }
}

// Run the fix if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixManualDurationEntries()
    .then(() => {
      console.log('🎉 Manual duration entries fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

export { fixManualDurationEntries };
