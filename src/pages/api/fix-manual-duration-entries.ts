import type { APIRoute } from 'astro';
import { db } from '../../db';
import { timeEntries } from '../../db/schema';
import { and, isNotNull, sql } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔧 Starting fix for manual duration entries...');
    
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
      return new Response(JSON.stringify({
        success: true,
        message: 'No problematic entries found. All manual duration entries are already correct.',
        fixedCount: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({
      success: true,
      message: `Fixed ${problematicEntries.length} manual duration entries`,
      fixedCount: problematicEntries.length,
      remainingProblematic: remainingProblematic.length,
      details: {
        problematicEntries: problematicEntries.map(entry => ({
          id: entry.id,
          userId: entry.userId,
          projectId: entry.projectId,
          durationManual: entry.durationManual,
          notes: entry.notes,
          createdAt: entry.createdAt
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fixing manual duration entries:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fix manual duration entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
