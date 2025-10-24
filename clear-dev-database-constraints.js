#!/usr/bin/env node

/**
 * Clear Development Database (Handle Constraints)
 * Handle foreign key constraints properly
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function clearDevelopmentDatabase() {
  console.log('🧹 Clearing Development Database (Handle Constraints)...\n');
  
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
    
    // Step 1: Disable foreign key constraints temporarily
    console.log('🔧 Step 1: Disabling foreign key constraints...');
    try {
      await sql`SET session_replication_role = replica`;
      console.log('   ✅ Foreign key constraints disabled');
    } catch (error) {
      console.log(`   ⚠️  Could not disable foreign key constraints: ${error.message}`);
    }
    
    // Step 2: Clear all tables
    console.log('\n🗑️  Step 2: Clearing all tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    for (const table of tables) {
      try {
        console.log(`   🗑️  Clearing ${table.table_name}...`);
        await sql.unsafe(`DELETE FROM ${table.table_name}`);
        console.log(`   ✅ Cleared ${table.table_name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${table.table_name}: ${error.message}`);
      }
    }
    
    // Step 3: Re-enable foreign key constraints
    console.log('\n🔧 Step 3: Re-enabling foreign key constraints...');
    try {
      await sql`SET session_replication_role = DEFAULT`;
      console.log('   ✅ Foreign key constraints re-enabled');
    } catch (error) {
      console.log(`   ⚠️  Could not re-enable foreign key constraints: ${error.message}`);
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
      console.log('💡 You may need to manually clear the remaining data.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

// Run the clear operation
clearDevelopmentDatabase().catch(console.error);
