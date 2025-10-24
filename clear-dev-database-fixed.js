#!/usr/bin/env node

/**
 * Clear Development Database (Fixed)
 * Remove all data from the development database to start fresh
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
    
    // Clear tables in the correct order (respecting foreign key constraints)
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
    
    console.log(`📋 Clearing ${tablesToClear.length} tables...\n`);
    
    for (const tableName of tablesToClear) {
      try {
        console.log(`🗑️  Clearing table: ${tableName}`);
        await sql`DELETE FROM ${sql(tableName)}`;
        console.log(`   ✅ Cleared ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Development database cleared successfully!');
    console.log('💡 You can now start fresh with development data.');
    
    // Verify the database is empty
    console.log('\n🔍 Verifying database is empty...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const timeEntryCount = await sql`SELECT COUNT(*) as count FROM time_entries`;
    
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Time Entries: ${timeEntryCount[0].count}`);
    
    if (userCount[0].count === 0 && timeEntryCount[0].count === 0) {
      console.log('✅ Database is now empty and ready for development!');
    } else {
      console.log('⚠️  Some data may still remain in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

// Run the clear operation
clearDevelopmentDatabase().catch(console.error);
