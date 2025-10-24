#!/usr/bin/env node

/**
 * Clear Development Database (DELETE CASCADE)
 * Use DELETE with CASCADE to clear all data
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
    
    // Use DELETE with CASCADE to clear all data
    console.log('🗑️  Deleting all data from database...');
    
    // Delete from all tables in dependency order
    const deleteCommands = [
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
    
    for (const command of deleteCommands) {
      try {
        console.log(`   🗑️  ${command.split(' ')[2]}...`);
        await sql.unsafe(command);
        console.log(`   ✅ Deleted from ${command.split(' ')[2]}`);
      } catch (error) {
        console.log(`   ⚠️  Could not delete from ${command.split(' ')[2]}: ${error.message}`);
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
