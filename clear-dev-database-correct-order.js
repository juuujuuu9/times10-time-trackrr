#!/usr/bin/env node

/**
 * Clear Development Database (Correct Order)
 * Delete data in the correct order to respect foreign key constraints
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function clearDevelopmentDatabase() {
  console.log('🧹 Clearing Development Database (Correct Order)...\n');
  
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
    
    // Delete in the correct order (child tables first, then parent tables)
    console.log('🗑️  Deleting data in correct order (respecting foreign key constraints)...');
    
    // Child tables first (those that reference other tables)
    const childTables = [
      'task_assignments',      // references tasks.id, users.id
      'task_discussions',      // references tasks.id, users.id
      'task_files',           // references tasks.id, users.id
      'task_links',           // references tasks.id, users.id
      'task_notes',           // references tasks.id, users.id
      'user_task_lists',      // references users.id, tasks.id
      'time_entries',         // references users.id, projects.id
      'notifications',        // references users.id
      'sessions',             // references users.id
      'password_reset_tokens', // references users.id
      'invitation_tokens',    // no foreign keys
      'slack_commands',       // no foreign keys
      'slack_users',          // references users.id
      'slack_workspaces',     // no foreign keys
      'team_members',         // references users.id, teams.id
      'tasks',                // references teams.id, projects.id
      'teams',                // references projects.id, users.id
      'projects',             // references clients.id
      'clients',              // references users.id
      'users'                 // parent table (no foreign keys to other tables)
    ];
    
    for (const tableName of childTables) {
      try {
        console.log(`   🗑️  Deleting from ${tableName}...`);
        const result = await sql.unsafe(`DELETE FROM ${tableName}`);
        console.log(`   ✅ Deleted from ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not delete from ${tableName}: ${error.message}`);
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
