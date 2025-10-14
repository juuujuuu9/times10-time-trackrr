#!/usr/bin/env node

/**
 * Production Error Diagnosis Script
 * Checks what might be causing 500 errors in production
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

console.log('🔍 Diagnosing Production 500 Errors');
console.log('=====================================');

async function diagnoseErrors() {
  let sql;
  
  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    sql = postgres(PRODUCTION_DATABASE_URL, {
      ssl: 'require',
      max: 1
    });
    
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Test 2: Check if users table has data
    console.log('\n2️⃣ Checking users table...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`📊 Users in database: ${userCount[0].count}`);
    
    if (userCount[0].count === 0) {
      console.log('⚠️  No users found - this could cause authentication issues');
    }
    
    // Test 3: Check if clients table exists and is accessible
    console.log('\n3️⃣ Testing clients table...');
    const clientCount = await sql`SELECT COUNT(*) as count FROM clients`;
    console.log(`📊 Clients in database: ${clientCount[0].count}`);
    
    // Test 4: Check if we can create a test client
    console.log('\n4️⃣ Testing client creation...');
    try {
      const testClient = await sql`
        INSERT INTO clients (name, created_by) 
        VALUES ('Test Client ${Date.now()}', 1) 
        RETURNING id, name
      `;
      console.log('✅ Client creation test successful:', testClient[0]);
      
      // Clean up
      await sql`DELETE FROM clients WHERE id = ${testClient[0].id}`;
      console.log('🧹 Test client cleaned up');
      
    } catch (createError) {
      console.log('❌ Client creation failed:', createError.message);
      
      if (createError.message.includes('foreign key')) {
        console.log('💡 Issue: No user with ID 1 exists (foreign key constraint)');
      } else if (createError.message.includes('not null')) {
        console.log('💡 Issue: Required field is missing');
      } else {
        console.log('💡 Issue:', createError.message);
      }
    }
    
    // Test 5: Check if we can create a project
    console.log('\n5️⃣ Testing project creation...');
    try {
      // First create a test client
      const testClient = await sql`
        INSERT INTO clients (name, created_by) 
        VALUES ('Test Client for Project', 1) 
        RETURNING id
      `;
      
      const testProject = await sql`
        INSERT INTO projects (name, client_id) 
        VALUES ('Test Project', ${testClient[0].id}) 
        RETURNING id, name
      `;
      console.log('✅ Project creation test successful:', testProject[0]);
      
      // Clean up
      await sql`DELETE FROM projects WHERE id = ${testProject[0].id}`;
      await sql`DELETE FROM clients WHERE id = ${testClient[0].id}`;
      console.log('🧹 Test data cleaned up');
      
    } catch (projectError) {
      console.log('❌ Project creation failed:', projectError.message);
    }
    
    // Test 6: Check environment variables
    console.log('\n6️⃣ Checking environment variables...');
    const requiredVars = [
      'DATABASE_URL',
      'RESEND_API_KEY',
      'BASE_URL',
      'PUBLIC_SITE_URL'
    ];
    
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`);
      } else {
        console.log(`❌ ${varName}: Not set`);
      }
    });
    
    console.log('\n🎯 Diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the diagnosis
diagnoseErrors().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
