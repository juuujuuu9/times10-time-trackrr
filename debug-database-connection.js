#!/usr/bin/env node

/**
 * Debug Database Connection
 * Check which database we're actually connecting to and what data we see
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function debugDatabaseConnection() {
  console.log('🔍 Debugging Database Connection...\n');
  
  // Get the database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('📡 Database URL:');
  console.log(`   ${databaseUrl}\n`);
  
  // Extract connection details
  try {
    const url = new URL(databaseUrl);
    console.log('🔗 Connection Details:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
    console.log(`   SSL: ${url.searchParams.get('sslmode') || 'not specified'}\n`);
  } catch (error) {
    console.error('❌ Error parsing database URL:', error.message);
  }
  
  // Test the connection
  try {
    console.log('🔌 Testing database connection...');
    const sql = neon(databaseUrl);
    
    // Test basic connection
    const testResult = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');
    
    // Get database info
    console.log('📊 Database Information:');
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `;
    
    console.log(`   Database Name: ${dbInfo[0].database_name}`);
    console.log(`   Current User: ${dbInfo[0].current_user}`);
    console.log(`   Server Address: ${dbInfo[0].server_address}`);
    console.log(`   Server Port: ${dbInfo[0].server_port}`);
    console.log(`   PostgreSQL Version: ${dbInfo[0].postgres_version.split(' ')[0]}\n`);
    
    // Check what tables exist
    console.log('📋 Available Tables:');
    const tables = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    tables.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_schema})`);
    });
    console.log('');
    
    // Check users table (if it exists)
    try {
      console.log('👥 Users in Database:');
      const users = await sql`
        SELECT id, email, name, role, status, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      if (users.length > 0) {
        console.log(`   Found ${users.length} users (showing first 5):`);
        users.forEach(user => {
          console.log(`   - ${user.name || 'No Name'} (${user.email}) - ${user.role} - ${user.status}`);
        });
      } else {
        console.log('   No users found in database');
      }
    } catch (error) {
      console.log('   Users table not found or error accessing it');
    }
    
    // Check time entries (if they exist)
    try {
      console.log('\n⏱️  Time Entries in Database:');
      const timeEntries = await sql`
        SELECT id, user_id, project_id, start_time, end_time, duration_manual, created_at 
        FROM time_entries 
        ORDER BY created_at DESC 
        LIMIT 3
      `;
      
      if (timeEntries.length > 0) {
        console.log(`   Found ${timeEntries.length} time entries (showing first 3):`);
        timeEntries.forEach(entry => {
          console.log(`   - User ${entry.user_id}, Project ${entry.project_id}, Created: ${entry.created_at}`);
        });
      } else {
        console.log('   No time entries found in database');
      }
    } catch (error) {
      console.log('   Time entries table not found or error accessing it');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Run the debug
debugDatabaseConnection().catch(console.error);
