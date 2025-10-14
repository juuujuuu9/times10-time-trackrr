#!/usr/bin/env node

/**
 * Production Migration Script
 * Applies the collaborative features migration to production database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error('❌ PRODUCTION_DATABASE_URL environment variable is required');
  console.error('Please set PRODUCTION_DATABASE_URL to your production database connection string');
  process.exit(1);
}

console.log('🚀 Starting Production Migration');
console.log('=====================================');

async function applyMigration() {
  let sql;
  
  try {
    // Create database connection
    sql = postgres(PRODUCTION_DATABASE_URL, {
      ssl: 'require',
      max: 1
    });
    
    console.log('✅ Connected to production database');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0013_add_collaborative_features.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded migration file: 0013_add_collaborative_features.sql');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Check if it's a "table already exists" error
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (table already exists)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying created tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'task_collaborations', 
        'task_discussions', 
        'task_files', 
        'task_links', 
        'task_notes', 
        'notifications'
      )
      ORDER BY table_name
    `;
    
    console.log('✅ Created tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    if (tables.length === 6) {
      console.log('\n🎯 All collaborative feature tables created successfully!');
      console.log('🚀 Your task stream should now work in production!');
    } else {
      console.log(`\n⚠️  Expected 6 tables, found ${tables.length}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
applyMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
