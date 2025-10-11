#!/usr/bin/env node

/**
 * Verify Schema Fix
 * This script verifies that all collaborative tables are present and working
 */

import { neon } from '@neondatabase/serverless';

console.log('✅ Verifying Schema Fix');
console.log('=======================');

async function verifySchemaFix() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Check all collaborative tables
    const collaborativeTables = [
      'teams', 'team_members', 'task_collaborations', 'task_discussions', 
      'task_files', 'task_links', 'task_notes', 'notifications'
    ];
    
    console.log('\n🔍 Checking collaborative tables...');
    const existingTables = [];
    const missingTables = [];
    
    for (const table of collaborativeTables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)} LIMIT 1`;
        console.log(`✅ ${table}: EXISTS (${result[0].count} records)`);
        existingTables.push(table);
      } catch (error) {
        console.log(`❌ ${table}: MISSING - ${error.message}`);
        missingTables.push(table);
      }
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
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
      AND tc.table_name IN ('task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tc.table_name
    `;
    
    console.log(`  Found ${foreignKeys.length} foreign key constraints for new tables:`);
    foreignKeys.forEach(fk => {
      console.log(`    - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check indexes
    console.log('\n📈 Checking indexes...');
    const indexes = await sql`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename IN ('task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tablename, indexname
    `;
    
    console.log(`  Found ${indexes.length} indexes for new tables:`);
    indexes.forEach(idx => {
      console.log(`    - ${idx.tablename}.${idx.indexname}`);
    });
    
    // Test a few key queries that the application would make
    console.log('\n🧪 Testing key queries...');
    
    try {
      // Test teams query (what collaborations page does)
      const teamsQuery = await sql`
        SELECT id, name, description, created_by, created_at, updated_at, archived
        FROM teams 
        WHERE archived = false 
        ORDER BY created_at DESC
      `;
      console.log(`✅ Teams query successful: ${teamsQuery.length} teams`);
    } catch (error) {
      console.log(`❌ Teams query failed: ${error.message}`);
    }
    
    try {
      // Test task collaborations query
      const collaborationsQuery = await sql`
        SELECT tc.id, tc.task_id, tc.team_id, tc.created_by, tc.created_at
        FROM task_collaborations tc
        LIMIT 5
      `;
      console.log(`✅ Task collaborations query successful: ${collaborationsQuery.length} collaborations`);
    } catch (error) {
      console.log(`❌ Task collaborations query failed: ${error.message}`);
    }
    
    try {
      // Test notifications query
      const notificationsQuery = await sql`
        SELECT id, user_id, type, title, message, read, created_at
        FROM notifications
        WHERE read = false
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log(`✅ Notifications query successful: ${notificationsQuery.length} unread notifications`);
    } catch (error) {
      console.log(`❌ Notifications query failed: ${error.message}`);
    }
    
    // Final summary
    console.log('\n📋 VERIFICATION SUMMARY');
    console.log('========================');
    console.log(`Collaborative tables: ${existingTables.length}/${collaborativeTables.length}`);
    console.log(`Foreign key constraints: ${foreignKeys.length}`);
    console.log(`Indexes: ${indexes.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log('\n🚨 Schema fix is incomplete!');
      return false;
    }
    
    if (existingTables.length === collaborativeTables.length) {
      console.log('\n🎉 All collaborative tables are present!');
      console.log('✅ The collaborative features should now work correctly.');
      console.log('🚀 You can now access /admin/collaborations without 500 errors.');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run the verification
verifySchemaFix()
  .then(success => {
    if (success) {
      console.log('\n✅ Schema verification passed!');
      console.log('🎯 The database is now ready for collaborative features.');
    } else {
      console.log('\n❌ Schema verification failed');
      console.log('🔧 Additional fixes may be needed.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Verification error:', error);
    process.exit(1);
  });
