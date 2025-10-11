#!/usr/bin/env node

/**
 * Verify Live Database Schema
 * Simple test to check if collaborative tables exist
 */

import { neon } from '@neondatabase/serverless';

console.log('🔍 Verifying Live Database Schema...');

async function verifySchema() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Check if tables exist using information_schema
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY table_name
    `;
    
    console.log('\n📊 Found collaborative tables:');
    existingTables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    const expectedTables = [
      'teams', 'team_members', 'task_collaborations', 'task_discussions', 
      'task_files', 'task_links', 'task_notes', 'notifications'
    ];
    
    const missingTables = expectedTables.filter(table => 
      !existingTables.some(t => t.table_name === table)
    );
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
      console.log('\nThis explains the 500 error on the live site.');
      return false;
    }
    
    console.log('\n✅ All collaborative tables exist!');
    
    // Test a simple query that the collaborations page would make
    try {
      const teamsCount = await sql`SELECT COUNT(*) as count FROM teams`;
      console.log(`✅ Teams table accessible: ${teamsCount[0].count} teams`);
      
      const membersCount = await sql`SELECT COUNT(*) as count FROM team_members`;
      console.log(`✅ Team members table accessible: ${membersCount[0].count} members`);
      
      console.log('\n🎉 Database schema is working correctly!');
      console.log('The 500 error might be due to:');
      console.log('1. Application deployment not completed yet');
      console.log('2. Environment variables not set correctly on live site');
      console.log('3. Application code issue');
      
      return true;
      
    } catch (error) {
      console.log(`❌ Database query failed: ${error.message}`);
      console.log('This is likely the cause of the 500 error.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    return false;
  }
}

// Run the verification
verifySchema()
  .then(success => {
    if (success) {
      console.log('\n✅ Database schema is correct');
    } else {
      console.log('\n❌ Database schema has issues');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Schema verification error:', error);
    process.exit(1);
  });
