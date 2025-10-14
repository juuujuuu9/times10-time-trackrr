#!/usr/bin/env node

/**
 * Database Manager Script
 * Helps manage multiple database environments
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

// Database configurations
const DATABASES = {
  local: {
    url: process.env.DATABASE_URL,
    name: 'Local Development',
    description: 'Your local development database'
  },
  production: {
    url: 'postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
    name: 'Production',
    description: 'Live production database'
  }
};

/**
 * Test connection to a specific database
 */
async function testConnection(dbKey) {
  const db = DATABASES[dbKey];
  if (!db || !db.url) {
    console.log(`❌ ${dbKey} database not configured`);
    return false;
  }

  try {
    const sql = neon(db.url);
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log(`✅ ${db.name} connection successful`);
    console.log(`   Current time: ${result[0].current_time}`);
    return true;
  } catch (error) {
    console.log(`❌ ${db.name} connection failed:`, error.message);
    return false;
  }
}

/**
 * Get schema information for a database
 */
async function getSchemaInfo(dbKey) {
  const db = DATABASES[dbKey];
  if (!db || !db.url) {
    console.log(`❌ ${dbKey} database not configured`);
    return null;
  }

  try {
    const sql = neon(db.url);
    
    // Get tables
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    // Get specific table info (teams table)
    let teamsInfo = null;
    try {
      const teamsColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'teams' 
        ORDER BY ordinal_position
      `;
      teamsInfo = teamsColumns;
    } catch (error) {
      console.log(`   ⚠️  Teams table not found or error: ${error.message}`);
    }
    
    return {
      tables: tables,
      teamsColumns: teamsInfo
    };
  } catch (error) {
    console.log(`❌ Error getting schema info for ${db.name}:`, error.message);
    return null;
  }
}

/**
 * Compare two databases
 */
async function compareDatabases() {
  console.log('🔍 Comparing database schemas...\n');
  
  const localInfo = await getSchemaInfo('local');
  const prodInfo = await getSchemaInfo('production');
  
  if (!localInfo || !prodInfo) {
    console.log('❌ Could not get schema information from one or both databases');
    return;
  }
  
  console.log('📊 Database Comparison:');
  console.log(`Local tables: ${localInfo.tables.length}`);
  console.log(`Production tables: ${prodInfo.tables.length}`);
  
  const localTableNames = localInfo.tables.map(t => t.table_name);
  const prodTableNames = prodInfo.tables.map(t => t.table_name);
  
  const missingInProd = localTableNames.filter(name => !prodTableNames.includes(name));
  const missingInLocal = prodTableNames.filter(name => !localTableNames.includes(name));
  
  if (missingInProd.length > 0) {
    console.log('\n⚠️  Tables in local but not in production:');
    missingInProd.forEach(table => console.log(`   - ${table}`));
  }
  
  if (missingInLocal.length > 0) {
    console.log('\n⚠️  Tables in production but not in local:');
    missingInLocal.forEach(table => console.log(`   - ${table}`));
  }
  
  // Compare teams table specifically
  console.log('\n🔍 Teams table comparison:');
  if (localInfo.teamsColumns && prodInfo.teamsColumns) {
    const localColumns = localInfo.teamsColumns.map(c => c.column_name);
    const prodColumns = prodInfo.teamsColumns.map(c => c.column_name);
    
    console.log(`Local teams columns: ${localColumns.join(', ')}`);
    console.log(`Production teams columns: ${prodColumns.join(', ')}`);
    
    const missingInProd = localColumns.filter(col => !prodColumns.includes(col));
    const missingInLocal = prodColumns.filter(col => !localColumns.includes(col));
    
    if (missingInProd.length > 0) {
      console.log(`⚠️  Columns in local but not in production: ${missingInProd.join(', ')}`);
    }
    
    if (missingInLocal.length > 0) {
      console.log(`⚠️  Columns in production but not in local: ${missingInLocal.join(', ')}`);
    }
  }
  
  if (missingInProd.length === 0 && missingInLocal.length === 0) {
    console.log('\n✅ Database schemas are in sync');
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  
  console.log('🗄️  Database Manager\n');
  
  switch (command) {
    case 'test':
      console.log('Testing database connections...\n');
      await testConnection('local');
      await testConnection('production');
      break;
      
    case 'compare':
      await compareDatabases();
      break;
      
    case 'info':
      console.log('Database Information:\n');
      Object.entries(DATABASES).forEach(([key, db]) => {
        console.log(`${key.toUpperCase()}:`);
        console.log(`  Name: ${db.name}`);
        console.log(`  Description: ${db.description}`);
        console.log(`  URL: ${db.url ? 'Configured' : 'Not configured'}`);
        console.log('');
      });
      break;
      
    default:
      console.log('Usage: node scripts/db-manager.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  test     - Test connections to all databases');
      console.log('  compare  - Compare schemas between databases');
      console.log('  info     - Show database configuration info');
      break;
  }
}

// Run the script
main().catch(console.error);
