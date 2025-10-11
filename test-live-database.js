#!/usr/bin/env node

/**
 * Test Live Database Connection and Schema
 * This script tests if the collaborative features are working on the live database
 */

import { neon } from '@neondatabase/serverless';

console.log('🧪 Testing Live Database Connection and Schema...');

async function testLiveDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Test 1: Check if all collaborative tables exist
    console.log('\n📊 Testing table existence...');
    
    const tables = [
      'teams',
      'team_members', 
      'task_collaborations',
      'task_discussions',
      'task_files',
      'task_links',
      'task_notes',
      'notifications'
    ];
    
    let allTablesExist = true;
    for (const table of tables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)} LIMIT 1`;
        console.log(`✅ ${table}: EXISTS (${result[0].count} records)`);
      } catch (error) {
        console.log(`❌ ${table}: MISSING - ${error.message}`);
        allTablesExist = false;
      }
    }
    
    if (!allTablesExist) {
      console.log('\n❌ Some collaborative tables are missing!');
      console.log('This explains the 500 error on the live site.');
      return false;
    }
    
    // Test 2: Try to query teams data (what the collaborations page does)
    console.log('\n🔍 Testing teams query (what collaborations page does)...');
    
    try {
      const teamsData = await sql`
        SELECT id, name, description, created_by, created_at, updated_at, archived
        FROM teams 
        WHERE archived = false 
        ORDER BY created_at DESC
      `;
      console.log(`✅ Teams query successful: ${teamsData.length} teams found`);
      
      // Test 3: Try to query team members
      const memberCounts = await sql`
        SELECT team_id, COUNT(user_id) as member_count
        FROM team_members 
        GROUP BY team_id
      `;
      console.log(`✅ Team members query successful: ${memberCounts.length} team-member relationships found`);
      
      // Test 4: Try to query users (for team creators)
      const users = await sql`
        SELECT id, name, email 
        FROM users 
        LIMIT 5
      `;
      console.log(`✅ Users query successful: ${users.length} users found`);
      
      console.log('\n🎉 All database queries are working!');
      console.log('The issue might be with the application deployment or environment variables.');
      
      return true;
      
    } catch (error) {
      console.log(`❌ Database query failed: ${error.message}`);
      console.log('This is likely the cause of the 500 error.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Run the test
testLiveDatabase()
  .then(success => {
    if (success) {
      console.log('\n✅ Database is working correctly');
      console.log('The 500 error might be due to:');
      console.log('1. Application deployment not completed yet');
      console.log('2. Environment variables not set correctly on live site');
      console.log('3. Application code issue');
    } else {
      console.log('\n❌ Database has issues');
      console.log('This explains the 500 error on the live site.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Database test error:', error);
    process.exit(1);
  });
