#!/usr/bin/env node

/**
 * Clear Development Database
 * Remove all data from the development database to start fresh
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function clearDevelopmentDatabase() {
  console.log('🧹 Clearing Development Database...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Database URL:', databaseUrl.split('@')[1].split('/')[0]);
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your development database!\n');
  
  try {
    const sql = neon(databaseUrl);
    
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`📋 Found ${tables.length} tables to clear:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');
    
    // Clear all tables in reverse order (to handle foreign key constraints)
    const tableNames = tables.map(t => t.table_name).reverse();
    
    for (const tableName of tableNames) {
      try {
        console.log(`🗑️  Clearing table: ${tableName}`);
        await sql`DELETE FROM ${sql(tableName)}`;
        console.log(`   ✅ Cleared ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Development database cleared successfully!');
    console.log('💡 You can now start fresh with development data.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

// Run the clear operation
clearDevelopmentDatabase().catch(console.error);
