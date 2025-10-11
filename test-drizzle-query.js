#!/usr/bin/env node

/**
 * Test Drizzle Query
 * This script tests the exact same Drizzle query that's failing in the application
 */

import { db } from './src/db/index.ts';
import { teams } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

console.log('🧪 Testing Drizzle Query...');

async function testDrizzleQuery() {
  try {
    console.log('✅ Database connection established');
    
    // Test the exact same query that's failing in the application
    console.log('🔍 Testing teams query with Drizzle...');
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        archived: teams.archived
      })
      .from(teams)
      .where(eq(teams.archived, false))
      .orderBy(desc(teams.createdAt));
    
    console.log(`✅ Drizzle query successful: ${teamsData.length} teams`);
    teamsData.forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.id})`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Drizzle query failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Run the test
testDrizzleQuery()
  .then(success => {
    if (success) {
      console.log('\n✅ Drizzle query is working correctly');
    } else {
      console.log('\n❌ Drizzle query has issues');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });
