#!/usr/bin/env node

/**
 * Fix Orphaned Time Entries
 * This script fixes orphaned time entries that reference non-existent projects
 */

import { neon } from '@neondatabase/serverless';

console.log('🔧 Fixing Orphaned Time Entries');
console.log('================================');

async function fixOrphanedEntries() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Find orphaned time entries
    console.log('\n🔍 Finding orphaned time entries...');
    const orphanedEntries = await sql`
      SELECT te.id, te.project_id, te.user_id, te.created_at, te.notes
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE p.id IS NULL
      ORDER BY te.created_at DESC
    `;
    
    console.log(`Found ${orphanedEntries.length} orphaned time entries`);
    
    if (orphanedEntries.length === 0) {
      console.log('✅ No orphaned entries found. Database is clean.');
      return true;
    }
    
    // Show some examples
    console.log('\n📋 Sample orphaned entries:');
    orphanedEntries.slice(0, 5).forEach(entry => {
      console.log(`  - Entry ${entry.id}: project_id ${entry.project_id} (user: ${entry.user_id}, created: ${entry.created_at})`);
    });
    
    // Get the first available project for reassignment
    console.log('\n🔍 Finding available projects...');
    const availableProjects = await sql`
      SELECT id, name, client_id 
      FROM projects 
      WHERE archived = false 
      ORDER BY id 
      LIMIT 5
    `;
    
    if (availableProjects.length === 0) {
      console.log('❌ No available projects found. Cannot fix orphaned entries.');
      return false;
    }
    
    console.log(`Found ${availableProjects.length} available projects:`);
    availableProjects.forEach(project => {
      console.log(`  - Project ${project.id}: ${project.name} (client: ${project.client_id})`);
    });
    
    const defaultProjectId = availableProjects[0].id;
    console.log(`\n🎯 Will reassign orphaned entries to project ${defaultProjectId} (${availableProjects[0].name})`);
    
    // Update orphaned entries
    console.log('\n🚀 Updating orphaned entries...');
    const updateResult = await sql`
      UPDATE time_entries 
      SET project_id = ${defaultProjectId},
          updated_at = NOW()
      WHERE id IN (
        SELECT te.id
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        WHERE p.id IS NULL
      )
    `;
    
    console.log(`✅ Updated ${updateResult.rowCount || 0} orphaned time entries`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingOrphaned = await sql`
      SELECT COUNT(*) as count
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE p.id IS NULL
    `;
    
    if (remainingOrphaned[0].count === '0') {
      console.log('✅ All orphaned entries have been fixed!');
      return true;
    } else {
      console.log(`❌ Still have ${remainingOrphaned[0].count} orphaned entries`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
}

// Run the fix
fixOrphanedEntries()
  .then(success => {
    if (success) {
      console.log('\n✅ Orphaned entries fix completed successfully!');
      console.log('🚀 You can now run the schema migration.');
    } else {
      console.log('\n❌ Orphaned entries fix had issues');
      console.log('🔍 Check the error messages above for details.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fix error:', error);
    process.exit(1);
  });
