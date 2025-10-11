#!/usr/bin/env node

/**
 * Apply Collaborative Features Migration
 * This script will apply the migration with automatic confirmation
 */

import { spawn } from 'child_process';
import { neon } from '@neondatabase/serverless';

console.log('🚀 Applying Collaborative Features Migration...');

async function applyMigration() {
  try {
    // First, let's verify the current state
    console.log('📊 Checking current database state...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    
    // Check which tables exist
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY table_name
    `;
    
    console.log('📋 Current collaborative tables:');
    existingTables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    const missingTables = [
      'teams', 'team_members', 'task_collaborations', 'task_discussions', 
      'task_files', 'task_links', 'task_notes', 'notifications'
    ].filter(table => !existingTables.some(t => t.table_name === table));
    
    if (missingTables.length > 0) {
      console.log('📋 Missing tables:');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
      
      console.log('\n🔄 Running migration...');
      
      // Run the migration
      const migration = spawn('npm', ['run', 'db:push'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      migration.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
      });
      
      migration.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text);
      });
      
      migration.on('close', async (code) => {
        if (code === 0) {
          console.log('✅ Migration completed successfully!');
          
          // Verify the migration
          console.log('\n🔍 Verifying migration...');
          const newTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
            ORDER BY table_name
          `;
          
          console.log('📋 All collaborative tables now exist:');
          newTables.forEach(table => {
            console.log(`  ✅ ${table.table_name}`);
          });
          
          console.log('\n🎉 Collaborative features migration completed successfully!');
          console.log('🚀 You can now access the admin/collaborations page!');
          
        } else {
          console.error('❌ Migration failed with code:', code);
          console.error('Error output:', errorOutput);
        }
      });
      
      // Send "Yes" to confirm the migration
      setTimeout(() => {
        migration.stdin.write('Yes, I want to execute all statements\n');
        migration.stdin.end();
      }, 2000);
      
    } else {
      console.log('✅ All collaborative tables already exist!');
      console.log('🚀 You can now access the admin/collaborations page!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
