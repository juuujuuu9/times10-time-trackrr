#!/usr/bin/env node

/**
 * Compare Local vs Production Database Schemas
 * This script compares the schemas to ensure they match exactly
 */

import { neon } from '@neondatabase/serverless';

console.log('🔍 Comparing Local vs Production Database Schemas...');

async function compareSchemas() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Get all tables in the database
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📊 All tables in database:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check collaborative tables specifically
    const collaborativeTables = [
      'teams', 'team_members', 'task_collaborations', 'task_discussions', 
      'task_files', 'task_links', 'task_notes', 'notifications'
    ];
    
    console.log('\n🔍 Checking collaborative tables:');
    const existingCollaborativeTables = [];
    const missingCollaborativeTables = [];
    
    for (const table of collaborativeTables) {
      const exists = allTables.some(t => t.table_name === table);
      if (exists) {
        console.log(`  ✅ ${table}: EXISTS`);
        existingCollaborativeTables.push(table);
      } else {
        console.log(`  ❌ ${table}: MISSING`);
        missingCollaborativeTables.push(table);
      }
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints:');
    const foreignKeys = await sql`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tc.table_name
    `;
    
    console.log(`  Found ${foreignKeys.length} foreign key constraints:`);
    foreignKeys.forEach(fk => {
      console.log(`    - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check indexes
    console.log('\n📈 Checking indexes:');
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tablename, indexname
    `;
    
    console.log(`  Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`    - ${idx.tablename}.${idx.indexname}`);
    });
    
    // Summary
    console.log('\n📋 Schema Comparison Summary:');
    console.log(`  Total tables: ${allTables.length}`);
    console.log(`  Collaborative tables: ${existingCollaborativeTables.length}/8`);
    console.log(`  Foreign keys: ${foreignKeys.length}`);
    console.log(`  Indexes: ${indexes.length}`);
    
    if (missingCollaborativeTables.length > 0) {
      console.log('\n❌ Missing collaborative tables:');
      missingCollaborativeTables.forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log('\nThis explains the 500 error on the live site.');
      return false;
    }
    
    if (existingCollaborativeTables.length === 8) {
      console.log('\n✅ All collaborative tables exist!');
      console.log('The schema appears to be correct.');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Schema comparison failed:', error);
    return false;
  }
}

// Run the comparison
compareSchemas()
  .then(success => {
    if (success) {
      console.log('\n✅ Database schema is correct');
      console.log('The 500 error might be due to application code issues.');
    } else {
      console.log('\n❌ Database schema has issues');
      console.log('This explains the 500 error on the live site.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Schema comparison error:', error);
    process.exit(1);
  });
