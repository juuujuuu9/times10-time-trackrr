#!/usr/bin/env node

/**
 * Clear Development Database (Simple)
 * Use direct SQL commands to clear the database
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
    
    // Use direct SQL commands to clear all tables
    console.log('🗑️  Clearing all data from database...');
    
    // Disable foreign key checks temporarily
    await sql`SET session_replication_role = replica;`;
    
    // Clear all tables
    const clearCommands = [
      'DELETE FROM task_assignments',
      'DELETE FROM task_discussions', 
      'DELETE FROM task_files',
      'DELETE FROM task_links',
      'DELETE FROM task_notes',
      'DELETE FROM tasks',
      'DELETE FROM time_entries',
      'DELETE FROM user_task_lists',
      'DELETE FROM team_members',
      'DELETE FROM teams',
      'DELETE FROM notifications',
      'DELETE FROM sessions',
      'DELETE FROM password_reset_tokens',
      'DELETE FROM invitation_tokens',
      'DELETE FROM slack_commands',
      'DELETE FROM slack_users',
      'DELETE FROM slack_workspaces',
      'DELETE FROM projects',
      'DELETE FROM clients',
      'DELETE FROM users'
    ];
    
    for (const command of clearCommands) {
      try {
        await sql.unsafe(command);
        console.log(`   ✅ ${command.split(' ')[2]}`);
      } catch (error) {
        console.log(`   ⚠️  ${command.split(' ')[2]}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await sql`SET session_replication_role = DEFAULT;`;
    
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
