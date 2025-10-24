#!/usr/bin/env node

/**
 * Debug Database Issue
 * Check what's preventing data deletion
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function debugDatabaseIssue() {
  console.log('🔍 Debugging Database Issue...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Database URL:', databaseUrl.split('@')[1].split('/')[0]);
  
  try {
    const sql = neon(databaseUrl);
    
    // Check if we can actually delete a single record
    console.log('🧪 Testing single record deletion...');
    
    // Get a specific user
    const testUser = await sql`SELECT id, email, name FROM users LIMIT 1`;
    if (testUser.length > 0) {
      console.log(`   Found test user: ${testUser[0].name} (${testUser[0].email})`);
      
      // Try to delete this specific user
      try {
        const deleteResult = await sql`DELETE FROM users WHERE id = ${testUser[0].id}`;
        console.log(`   ✅ Successfully deleted user ${testUser[0].id}`);
        
        // Check if it's actually gone
        const checkUser = await sql`SELECT id, email, name FROM users WHERE id = ${testUser[0].id}`;
        if (checkUser.length === 0) {
          console.log('   ✅ User is actually gone from database');
        } else {
          console.log('   ❌ User still exists in database after deletion');
        }
      } catch (error) {
        console.log(`   ❌ Could not delete user: ${error.message}`);
      }
    } else {
      console.log('   No users found to test with');
    }
    
    // Check if there are any database-level constraints
    console.log('\n🔧 Checking database constraints...');
    
    // Check if there are any check constraints
    const checkConstraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = 'public'
    `;
    
    if (checkConstraints.length > 0) {
      console.log('   Check constraints found:');
      checkConstraints.forEach(constraint => {
        console.log(`   - ${constraint.table_name}: ${constraint.check_clause}`);
      });
    } else {
      console.log('   No check constraints found');
    }
    
    // Check if there are any rules
    const rules = await sql`
      SELECT 
        schemaname,
        tablename,
        rulename,
        definition
      FROM pg_rules
      WHERE schemaname = 'public'
    `;
    
    if (rules.length > 0) {
      console.log('   Database rules found:');
      rules.forEach(rule => {
        console.log(`   - ${rule.tablename}: ${rule.definition}`);
      });
    } else {
      console.log('   No database rules found');
    }
    
    // Check if there are any policies
    const policies = await sql`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
    `;
    
    if (policies.length > 0) {
      console.log('   Row-level security policies found:');
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname}`);
      });
    } else {
      console.log('   No row-level security policies found');
    }
    
    // Check if row-level security is enabled
    const rlsEnabled = await sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = true
    `;
    
    if (rlsEnabled.length > 0) {
      console.log('   Row-level security enabled on tables:');
      rlsEnabled.forEach(table => {
        console.log(`   - ${table.tablename}`);
      });
    } else {
      console.log('   Row-level security not enabled');
    }
    
    // Check if there are any database-level locks
    console.log('\n🔒 Checking for database locks...');
    const locks = await sql`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query
      FROM pg_stat_activity
      WHERE state = 'active'
      AND query NOT LIKE '%pg_stat_activity%'
    `;
    
    if (locks.length > 0) {
      console.log('   Active database connections:');
      locks.forEach(lock => {
        console.log(`   - PID ${lock.pid}: ${lock.usename} - ${lock.state}`);
      });
    } else {
      console.log('   No active database connections found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging database:', error.message);
  }
}

// Run the debug
debugDatabaseIssue().catch(console.error);
