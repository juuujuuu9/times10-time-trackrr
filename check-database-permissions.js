#!/usr/bin/env node

/**
 * Check Database Permissions
 * Check if we have write permissions and what's preventing data deletion
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabasePermissions() {
  console.log('🔍 Checking Database Permissions...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Database URL:', databaseUrl.split('@')[1].split('/')[0]);
  
  try {
    const sql = neon(databaseUrl);
    
    // Check current user permissions
    console.log('👤 Current User Permissions:');
    const userInfo = await sql`
      SELECT 
        current_user as current_user,
        session_user as session_user,
        current_database() as database_name,
        current_schema() as current_schema
    `;
    
    console.log(`   Current User: ${userInfo[0].current_user}`);
    console.log(`   Session User: ${userInfo[0].session_user}`);
    console.log(`   Database: ${userInfo[0].database_name}`);
    console.log(`   Schema: ${userInfo[0].current_schema}\n`);
    
    // Check if we can write to the database
    console.log('✍️  Testing Write Permissions:');
    
    try {
      // Try to create a test table
      await sql`CREATE TEMP TABLE test_write_permissions (id SERIAL PRIMARY KEY, test_data TEXT)`;
      console.log('   ✅ Can create tables');
      
      // Try to insert data
      await sql`INSERT INTO test_write_permissions (test_data) VALUES ('test')`;
      console.log('   ✅ Can insert data');
      
      // Try to update data
      await sql`UPDATE test_write_permissions SET test_data = 'updated' WHERE id = 1`;
      console.log('   ✅ Can update data');
      
      // Try to delete data
      await sql`DELETE FROM test_write_permissions WHERE id = 1`;
      console.log('   ✅ Can delete data');
      
      // Drop the test table
      await sql`DROP TABLE test_write_permissions`;
      console.log('   ✅ Can drop tables');
      
    } catch (error) {
      console.log(`   ❌ Write permission error: ${error.message}`);
    }
    
    // Check specific table permissions
    console.log('\n📋 Table Permissions:');
    const tablePermissions = await sql`
      SELECT 
        table_name,
        privilege_type
      FROM information_schema.table_privileges 
      WHERE grantee = current_user 
      AND table_schema = 'public'
      ORDER BY table_name, privilege_type
    `;
    
    const permissionsByTable = {};
    tablePermissions.forEach(row => {
      if (!permissionsByTable[row.table_name]) {
        permissionsByTable[row.table_name] = [];
      }
      permissionsByTable[row.table_name].push(row.privilege_type);
    });
    
    Object.keys(permissionsByTable).forEach(tableName => {
      console.log(`   ${tableName}: ${permissionsByTable[tableName].join(', ')}`);
    });
    
    // Check if there are any triggers that might be preventing deletion
    console.log('\n🔧 Database Triggers:');
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `;
    
    if (triggers.length > 0) {
      triggers.forEach(trigger => {
        console.log(`   ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    } else {
      console.log('   No triggers found');
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:');
    const foreignKeys = await sql`
      SELECT 
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
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `;
    
    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('   No foreign key constraints found');
    }
    
  } catch (error) {
    console.error('❌ Error checking database permissions:', error.message);
  }
}

// Run the check
checkDatabasePermissions().catch(console.error);
