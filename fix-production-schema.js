#!/usr/bin/env node

/**
 * Fix Production Schema Script
 * Applies missing migrations to production database
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error('❌ PRODUCTION_DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔧 Fixing Production Schema');
console.log('=====================================');

async function fixProductionSchema() {
  let sql;
  
  try {
    // Create database connection
    sql = postgres(PRODUCTION_DATABASE_URL, {
      ssl: 'require',
      max: 1
    });
    
    console.log('✅ Connected to production database');
    
    // Check if is_system column exists in tasks table
    console.log('\n1️⃣ Checking tasks table schema...');
    const tasksColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const hasIsSystemColumn = tasksColumns.some(col => col.column_name === 'is_system');
    console.log(`📊 Tasks table has ${tasksColumns.length} columns`);
    console.log(`🔍 is_system column exists: ${hasIsSystemColumn ? '✅' : '❌'}`);
    
    if (!hasIsSystemColumn) {
      console.log('\n2️⃣ Adding missing is_system column to tasks table...');
      await sql`ALTER TABLE "tasks" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL`;
      console.log('✅ Added is_system column to tasks table');
    } else {
      console.log('✅ is_system column already exists in tasks table');
    }
    
    // Check if is_system column exists in projects table
    console.log('\n3️⃣ Checking projects table schema...');
    const projectsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const projectsHasIsSystemColumn = projectsColumns.some(col => col.column_name === 'is_system');
    console.log(`📊 Projects table has ${projectsColumns.length} columns`);
    console.log(`🔍 is_system column exists: ${projectsHasIsSystemColumn ? '✅' : '❌'}`);
    
    if (!projectsHasIsSystemColumn) {
      console.log('\n4️⃣ Adding missing is_system column to projects table...');
      await sql`ALTER TABLE "projects" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL`;
      console.log('✅ Added is_system column to projects table');
    } else {
      console.log('✅ is_system column already exists in projects table');
    }
    
    // Verify the fix
    console.log('\n5️⃣ Verifying schema fix...');
    const finalTasksColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND table_schema = 'public' AND column_name = 'is_system'
    `;
    
    const finalProjectsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND table_schema = 'public' AND column_name = 'is_system'
    `;
    
    if (finalTasksColumns.length > 0 && finalProjectsColumns.length > 0) {
      console.log('🎉 Schema fix completed successfully!');
      console.log('✅ Both tasks and projects tables now have is_system columns');
      console.log('🚀 Client creation should now work properly!');
    } else {
      console.log('⚠️  Schema fix may not have completed successfully');
    }
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
fixProductionSchema().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
