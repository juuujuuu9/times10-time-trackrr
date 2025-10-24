#!/usr/bin/env node

/**
 * Test Database Write
 * Test if we can actually write to the database
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseWrite() {
  console.log('🧪 Testing Database Write Operations...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Database URL:', databaseUrl.split('@')[1].split('/')[0]);
  
  try {
    const sql = neon(databaseUrl);
    
    // Test 1: Create a test table
    console.log('🧪 Test 1: Creating test table...');
    try {
      await sql`CREATE TABLE IF NOT EXISTS test_write_table (id SERIAL PRIMARY KEY, test_data TEXT, created_at TIMESTAMP DEFAULT NOW())`;
      console.log('   ✅ Test table created successfully');
    } catch (error) {
      console.log(`   ❌ Could not create test table: ${error.message}`);
      return;
    }
    
    // Test 2: Insert data
    console.log('🧪 Test 2: Inserting test data...');
    try {
      const insertResult = await sql`INSERT INTO test_write_table (test_data) VALUES ('test data') RETURNING id`;
      console.log(`   ✅ Test data inserted with ID: ${insertResult[0].id}`);
    } catch (error) {
      console.log(`   ❌ Could not insert test data: ${error.message}`);
      return;
    }
    
    // Test 3: Read data
    console.log('🧪 Test 3: Reading test data...');
    try {
      const readResult = await sql`SELECT * FROM test_write_table ORDER BY id DESC LIMIT 1`;
      console.log(`   ✅ Test data read: ${readResult[0].test_data} (ID: ${readResult[0].id})`);
    } catch (error) {
      console.log(`   ❌ Could not read test data: ${error.message}`);
      return;
    }
    
    // Test 4: Update data
    console.log('🧪 Test 4: Updating test data...');
    try {
      const updateResult = await sql`UPDATE test_write_table SET test_data = 'updated test data' WHERE test_data = 'test data' RETURNING id`;
      console.log(`   ✅ Test data updated: ${updateResult.length} rows affected`);
    } catch (error) {
      console.log(`   ❌ Could not update test data: ${error.message}`);
      return;
    }
    
    // Test 5: Delete data
    console.log('🧪 Test 5: Deleting test data...');
    try {
      const deleteResult = await sql`DELETE FROM test_write_table WHERE test_data = 'updated test data' RETURNING id`;
      console.log(`   ✅ Test data deleted: ${deleteResult.length} rows affected`);
    } catch (error) {
      console.log(`   ❌ Could not delete test data: ${error.message}`);
      return;
    }
    
    // Test 6: Drop table
    console.log('🧪 Test 6: Dropping test table...');
    try {
      await sql`DROP TABLE test_write_table`;
      console.log('   ✅ Test table dropped successfully');
    } catch (error) {
      console.log(`   ❌ Could not drop test table: ${error.message}`);
      return;
    }
    
    console.log('\n🎉 All database write operations successful!');
    console.log('💡 The database is writable and working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing database write:', error.message);
  }
}

// Run the test
testDatabaseWrite().catch(console.error);
