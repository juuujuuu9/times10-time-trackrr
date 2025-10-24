#!/usr/bin/env node

/**
 * Clear Development Database (TRUNCATE)
 * Use TRUNCATE to efficiently clear all tables
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function clearDevelopmentDatabase() {
  console.log('🧹 Clearing Development Database...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Database URL:', databaseUrl.split('@')[1].split('/')[0]);
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your development database!\n');
  
  try {
    const sql = neon(databaseUrl);
    
    // Get current data counts
    console.log('📊 Current data in database:');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const timeEntryCount = await sql`SELECT COUNT(*) as count FROM time_entries`;
    const taskCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    const projectCount = await sql`SELECT COUNT(*) as count FROM projects`;
    
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Time Entries: ${timeEntryCount[0].count}`);
    console.log(`   Tasks: ${taskCount[0].count}`);
    console.log(`   Projects: ${projectCount[0].count}\n`);
    
    // Clear tables in the correct order (respecting foreign key constraints)
    console.log('🗑️  Clearing tables in dependency order...');
    
    const tablesToClear = [
      'task_assignments',
      'task_discussions', 
      'task_files',
      'task_links',
      'task_notes',
      'tasks',
      'time_entries',
      'user_task_lists',
      'team_members',
      'teams',
      'notifications',
      'sessions',
      'password_reset_tokens',
      'invitation_tokens',
      'slack_commands',
      'slack_users',
      'slack_workspaces',
      'projects',
      'clients',
      'users'
    ];
    
    for (const tableName of tablesToClear) {
      try {
        console.log(`   🗑️  Clearing ${tableName}...`);
        await sql.unsafe(`TRUNCATE TABLE ${tableName} CASCADE`);
        console.log(`   ✅ Cleared ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Development database cleared successfully!');
    console.log('💡 You can now start fresh with development data.');
    
    // Verify the database is empty
    console.log('\n🔍 Verifying database is empty...');
    const finalUserCount = await sql`SELECT COUNT(*) as count FROM users`;
    const finalTimeEntryCount = await sql`SELECT COUNT(*) as count FROM time_entries`;
    const finalTaskCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    const finalProjectCount = await sql`SELECT COUNT(*) as count FROM projects`;
    
    console.log(`   Users: ${finalUserCount[0].count}`);
    console.log(`   Time Entries: ${finalTimeEntryCount[0].count}`);
    console.log(`   Tasks: ${finalTaskCount[0].count}`);
    console.log(`   Projects: ${finalProjectCount[0].count}`);
    
    if (finalUserCount[0].count === 0 && finalTimeEntryCount[0].count === 0 && finalTaskCount[0].count === 0 && finalProjectCount[0].count === 0) {
      console.log('\n✅ Database is now completely empty and ready for development!');
      console.log('🚀 You can now run your application and it will show no data.');
    } else {
      console.log('\n⚠️  Some data may still remain in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

// Run the clear operation
clearDevelopmentDatabase().catch(console.error);
