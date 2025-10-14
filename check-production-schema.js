#!/usr/bin/env node

/**
 * Check Production Schema Script
 * Verifies which collaborative tables exist in production
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error('❌ PRODUCTION_DATABASE_URL environment variable is required');
  console.error('Please set PRODUCTION_DATABASE_URL to your production database connection string');
  process.exit(1);
}

console.log('🔍 Checking Production Database Schema');
console.log('=====================================');

async function checkSchema() {
  let sql;
  
  try {
    // Create database connection
    sql = postgres(PRODUCTION_DATABASE_URL, {
      ssl: 'require',
      max: 1
    });
    
    console.log('✅ Connected to production database');
    
    // Check for collaborative tables
    const expectedTables = [
      'teams',
      'team_members', 
      'task_collaborations',
      'task_discussions',
      'task_files',
      'task_links',
      'task_notes',
      'notifications'
    ];
    
    console.log('\n📊 Checking collaborative feature tables...');
    
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY(${expectedTables})
      ORDER BY table_name
    `;
    
    const existingTableNames = existingTables.map(t => t.table_name);
    
    console.log('\n📋 Table Status:');
    expectedTables.forEach(tableName => {
      const exists = existingTableNames.includes(tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    });
    
    const missingTables = expectedTables.filter(name => !existingTableNames.includes(name));
    
    if (missingTables.length === 0) {
      console.log('\n🎉 All collaborative tables exist!');
      console.log('🚀 Your task stream should work in production!');
    } else {
      console.log(`\n⚠️  Missing ${missingTables.length} tables:`);
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n🔧 You need to run the migration to create these tables.');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkSchema().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
