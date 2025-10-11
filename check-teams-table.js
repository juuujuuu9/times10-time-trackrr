#!/usr/bin/env node

/**
 * Check Teams Table Structure
 * This script checks the actual structure of the teams table
 */

import { neon } from '@neondatabase/serverless';

console.log('🔍 Checking Teams Table Structure...');

async function checkTeamsTable() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Check if teams table exists
    console.log('\n📊 Checking if teams table exists...');
    const tableExists = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'teams'
    `;
    
    if (tableExists.length === 0) {
      console.log('❌ Teams table does not exist!');
      return false;
    }
    
    console.log('✅ Teams table exists');
    
    // Check table structure
    console.log('\n📋 Checking teams table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('Teams table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if all required columns exist
    const requiredColumns = ['id', 'name', 'description', 'created_by', 'created_at', 'updated_at', 'archived'];
    const existingColumns = columns.map(col => col.column_name);
    
    console.log('\n🔍 Checking for required columns...');
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:');
      missingColumns.forEach(col => {
        console.log(`  - ${col}`);
      });
      return false;
    }
    
    console.log('✅ All required columns exist');
    
    // Try a simple query
    console.log('\n🧪 Testing simple teams query...');
    try {
      const simpleQuery = await sql`SELECT COUNT(*) as count FROM teams`;
      console.log(`✅ Simple query successful: ${simpleQuery[0].count} teams`);
    } catch (error) {
      console.log(`❌ Simple query failed: ${error.message}`);
      return false;
    }
    
    // Try the problematic query
    console.log('\n🧪 Testing problematic teams query...');
    try {
      const problematicQuery = await sql`
        SELECT id, name, description, created_by, created_at, updated_at, archived
        FROM teams 
        WHERE archived = false 
        ORDER BY created_at DESC
      `;
      console.log(`✅ Problematic query successful: ${problematicQuery.length} teams`);
    } catch (error) {
      console.log(`❌ Problematic query failed: ${error.message}`);
      console.log('This is the exact error causing the 500!');
      return false;
    }
    
    console.log('\n🎉 Teams table is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    return false;
  }
}

// Run the check
checkTeamsTable()
  .then(success => {
    if (success) {
      console.log('\n✅ Teams table is working correctly');
    } else {
      console.log('\n❌ Teams table has issues');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Check error:', error);
    process.exit(1);
  });
