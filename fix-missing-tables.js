#!/usr/bin/env node

/**
 * Fix Missing Collaborative Tables
 * This script applies the missing collaborative features migration to production
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';

console.log('🔧 Fixing Missing Collaborative Tables');
console.log('=====================================');

async function fixMissingTables() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Read the migration file
    const migrationFile = './drizzle/0013_add_collaborative_features.sql';
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log('✅ Migration file loaded');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Check which tables already exist
    console.log('\n🔍 Checking existing tables...');
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
    `;
    
    const existingTableNames = existingTables.map(t => t.table_name);
    console.log(`Existing tables: ${existingTableNames.join(', ') || 'none'}`);
    
    if (existingTableNames.length > 0) {
      console.log('⚠️  Some tables already exist. This script will skip existing tables.');
    }
    
    // Execute each statement
    console.log('\n🚀 Executing migration statements...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      try {
        console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
        
        // Check if this is a CREATE TABLE statement and if the table already exists
        if (statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE "?(\w+)"?/);
          if (tableMatch) {
            const tableName = tableMatch[1];
            if (existingTableNames.includes(tableName)) {
              console.log(`⏭️  Skipping ${tableName} (already exists)`);
              skipCount++;
              continue;
            }
          }
        }
        
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
        
        // Continue with other statements even if one fails
        console.log('⏭️  Continuing with remaining statements...');
      }
    }
    
    // Verify the results
    console.log('\n🔍 Verifying results...');
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
    `;
    
    const finalTableNames = finalTables.map(t => t.table_name);
    console.log(`Final tables: ${finalTableNames.join(', ')}`);
    
    // Summary
    console.log('\n📋 EXECUTION SUMMARY');
    console.log('====================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⏭️  Skipped statements: ${skipCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total tables now present: ${finalTableNames.length}/6`);
    
    if (finalTableNames.length === 6) {
      console.log('\n🎉 All collaborative tables are now present!');
      console.log('✅ The collaborative features should now work correctly.');
      return true;
    } else {
      console.log('\n⚠️  Some tables are still missing.');
      console.log('You may need to run this script again or check for errors.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
}

// Run the fix
fixMissingTables()
  .then(success => {
    if (success) {
      console.log('\n✅ Database fix completed successfully!');
      console.log('🚀 You can now test the collaborative features.');
    } else {
      console.log('\n❌ Database fix had issues');
      console.log('🔍 Check the error messages above for details.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fix error:', error);
    process.exit(1);
  });
