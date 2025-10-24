#!/usr/bin/env node

/**
 * Clear Local Database Script
 * This script will clear all data from your local development database
 * and reset it to a clean state for development
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔍 Database URL:', DATABASE_URL.split('@')[1].split('/')[0]);

const sql = neon(DATABASE_URL);

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing local database...');
    
    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`📋 Found ${tables.length} tables to clear`);
    
    // Disable foreign key checks temporarily
    await sql`SET session_replication_role = replica;`;
    
    // Clear all tables
    for (const table of tables) {
      console.log(`   Clearing ${table.table_name}...`);
      await sql.unsafe(`TRUNCATE TABLE "${table.table_name}" RESTART IDENTITY CASCADE;`);
    }
    
    // Re-enable foreign key checks
    await sql`SET session_replication_role = DEFAULT;`;
    
    console.log('✅ Local database cleared successfully!');
    console.log('🎯 Your localhost should now show clean development data');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

// Confirm before proceeding
console.log('⚠️  WARNING: This will DELETE ALL DATA from your local database!');
console.log('📊 Database endpoint:', DATABASE_URL.split('@')[1].split('/')[0]);
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to clear the local database? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    clearDatabase().then(() => {
      console.log('🎉 Database cleared! Restart your development server to see the changes.');
      rl.close();
    });
  } else {
    console.log('❌ Operation cancelled');
    rl.close();
  }
});
