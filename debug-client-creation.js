#!/usr/bin/env node

/**
 * Debug Client Creation Script
 * Tests the exact client creation process to identify the issue
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

console.log('🔍 Debugging Client Creation Process');
console.log('=====================================');

async function debugClientCreation() {
  let sql;
  
  try {
    // Create database connection
    sql = postgres(PRODUCTION_DATABASE_URL, {
      ssl: 'require',
      max: 1
    });
    
    console.log('✅ Connected to production database');
    
    // Test 1: Check if we can create a client
    console.log('\n1️⃣ Testing client creation...');
    try {
      const testClient = await sql`
        INSERT INTO clients (name, created_by) 
        VALUES ('Debug Test Client', 1) 
        RETURNING id, name, created_by
      `;
      console.log('✅ Client creation successful:', testClient[0]);
      
      // Test 2: Check if we can create a project for this client
      console.log('\n2️⃣ Testing project creation...');
      try {
        const testProject = await sql`
          INSERT INTO projects (name, client_id, is_system) 
          VALUES ('Debug Test Project', ${testClient[0].id}, false) 
          RETURNING id, name, client_id, is_system
        `;
        console.log('✅ Project creation successful:', testProject[0]);
        
        // Test 3: Check if we can create a task for this project
        console.log('\n3️⃣ Testing task creation...');
        try {
          const testTask = await sql`
            INSERT INTO tasks (project_id, name, description, is_system) 
            VALUES (${testProject[0].id}, 'General', 'General time tracking for Debug Test Client', true) 
            RETURNING id, project_id, name, description, is_system
          `;
          console.log('✅ Task creation successful:', testTask[0]);
          
          // Clean up test data
          console.log('\n4️⃣ Cleaning up test data...');
          await sql`DELETE FROM tasks WHERE id = ${testTask[0].id}`;
          await sql`DELETE FROM projects WHERE id = ${testProject[0].id}`;
          await sql`DELETE FROM clients WHERE id = ${testClient[0].id}`;
          console.log('🧹 Test data cleaned up');
          
          console.log('\n🎉 All database operations successful!');
          console.log('💡 The issue might be in the API code or environment variables');
          
        } catch (taskError) {
          console.log('❌ Task creation failed:', taskError.message);
          console.log('💡 This is likely the source of the 500 error');
          
          // Clean up what we can
          try {
            await sql`DELETE FROM projects WHERE id = ${testProject[0].id}`;
            await sql`DELETE FROM clients WHERE id = ${testClient[0].id}`;
          } catch (cleanupError) {
            console.log('⚠️  Cleanup failed:', cleanupError.message);
          }
        }
        
      } catch (projectError) {
        console.log('❌ Project creation failed:', projectError.message);
        console.log('💡 This is likely the source of the 500 error');
        
        // Clean up
        try {
          await sql`DELETE FROM clients WHERE id = ${testClient[0].id}`;
        } catch (cleanupError) {
          console.log('⚠️  Cleanup failed:', cleanupError.message);
        }
      }
      
    } catch (clientError) {
      console.log('❌ Client creation failed:', clientError.message);
      console.log('💡 This is likely the source of the 500 error');
    }
    
    // Test 5: Check foreign key constraints
    console.log('\n5️⃣ Checking foreign key constraints...');
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('clients', 'projects', 'tasks')
      ORDER BY tc.table_name, tc.constraint_name
    `;
    
    console.log('📊 Foreign key constraints:');
    constraints.forEach(constraint => {
      console.log(`   ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugClientCreation().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
