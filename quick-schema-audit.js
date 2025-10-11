#!/usr/bin/env node

/**
 * Quick Database Schema Audit
 * Simple script to audit current database schema and identify environment
 */

import { neon } from '@neondatabase/serverless';

console.log('🔍 Quick Database Schema Audit');
console.log('==============================');

async function quickAudit() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Determine environment based on URL
    let environment = 'unknown';
    if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      environment = 'localhost';
    } else if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.tech')) {
      environment = 'production';
    } else {
      environment = 'other';
    }
    
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔗 Database URL: ${databaseUrl.substring(0, 20)}...`);
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Get basic table information
    const tables = await sql`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    
    // Check for collaborative features tables
    const collaborativeTables = [
      'teams', 'team_members', 'task_collaborations', 'task_discussions', 
      'task_files', 'task_links', 'task_notes', 'notifications'
    ];
    
    console.log('\n🔍 Checking collaborative features tables:');
    const existingCollaborativeTables = [];
    const missingCollaborativeTables = [];
    
    for (const table of collaborativeTables) {
      const exists = tables.some(t => t.table_name === table);
      if (exists) {
        console.log(`  ✅ ${table}: EXISTS`);
        existingCollaborativeTables.push(table);
      } else {
        console.log(`  ❌ ${table}: MISSING`);
        missingCollaborativeTables.push(table);
      }
    }
    
    // Check core application tables
    const coreTables = [
      'users', 'sessions', 'clients', 'projects', 'tasks', 'time_entries',
      'invitation_tokens', 'password_reset_tokens', 'slack_workspaces', 
      'slack_users', 'slack_commands', 'user_task_lists'
    ];
    
    console.log('\n🔍 Checking core application tables:');
    const existingCoreTables = [];
    const missingCoreTables = [];
    
    for (const table of coreTables) {
      const exists = tables.some(t => t.table_name === table);
      if (exists) {
        console.log(`  ✅ ${table}: EXISTS`);
        existingCoreTables.push(table);
      } else {
        console.log(`  ❌ ${table}: MISSING`);
        missingCoreTables.push(table);
      }
    }
    
    // Get detailed column information for key tables
    console.log('\n📋 Detailed table information:');
    
    for (const tableName of ['users', 'time_entries', 'teams', 'projects']) {
      if (tables.some(t => t.table_name === tableName)) {
        try {
          const columns = await sql`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_name = ${tableName} 
            AND table_schema = 'public'
            ORDER BY ordinal_position
          `;
          
          console.log(`\n  📋 ${tableName} columns:`);
          columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`    - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
          });
        } catch (error) {
          console.log(`    ❌ Error reading ${tableName}: ${error.message}`);
        }
      }
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Foreign key constraints:');
    try {
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
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `;
      
      console.log(`  Found ${foreignKeys.length} foreign key constraints:`);
      foreignKeys.forEach(fk => {
        console.log(`    - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } catch (error) {
      console.log(`  ❌ Error reading foreign keys: ${error.message}`);
    }
    
    // Check indexes
    console.log('\n📈 Indexes:');
    try {
      const indexes = await sql`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;
      
      console.log(`  Found ${indexes.length} indexes:`);
      indexes.forEach(idx => {
        console.log(`    - ${idx.tablename}.${idx.indexname}`);
      });
    } catch (error) {
      console.log(`  ❌ Error reading indexes: ${error.message}`);
    }
    
    // Summary
    console.log('\n📋 SCHEMA SUMMARY');
    console.log('==================');
    console.log(`Environment: ${environment}`);
    console.log(`Total tables: ${tables.length}`);
    console.log(`Core tables: ${existingCoreTables.length}/${coreTables.length}`);
    console.log(`Collaborative tables: ${existingCollaborativeTables.length}/${collaborativeTables.length}`);
    
    if (missingCoreTables.length > 0) {
      console.log('\n❌ MISSING CORE TABLES:');
      missingCoreTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    if (missingCollaborativeTables.length > 0) {
      console.log('\n❌ MISSING COLLABORATIVE TABLES:');
      missingCollaborativeTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    if (missingCoreTables.length === 0 && missingCollaborativeTables.length === 0) {
      console.log('\n✅ All expected tables are present!');
    }
    
    // Environment-specific recommendations
    if (environment === 'production') {
      if (missingCollaborativeTables.length > 0) {
        console.log('\n🚨 PRODUCTION ISSUE: Missing collaborative tables!');
        console.log('This explains any 500 errors on the live site.');
        console.log('Run: npm run db:push or apply migrations to fix.');
      }
    } else if (environment === 'localhost') {
      if (missingCollaborativeTables.length > 0) {
        console.log('\n⚠️  LOCAL DEVELOPMENT: Missing collaborative tables');
        console.log('Run: npm run db:push to sync with schema');
      }
    }
    
    console.log('\n🎉 Schema audit completed!');
    
  } catch (error) {
    console.error('❌ Schema audit failed:', error);
    process.exit(1);
  }
}

// Run the audit
quickAudit();
