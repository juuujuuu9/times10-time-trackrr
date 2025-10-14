#!/usr/bin/env node

/**
 * Migration Script: Add project_id column to teams table in production
 * This script adds the missing project_id column to the production teams table
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

async function addProjectIdToTeams() {
  console.log('🔄 Adding project_id column to teams table in production...\n');
  
  try {
    // Connect to production database
    const prodUrl = 'postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(prodUrl);
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current teams table structure
    console.log('\n📊 Current teams table structure:');
    const currentColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `;
    
    currentColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Step 2: Check if project_id column already exists
    const hasProjectId = currentColumns.some(col => col.column_name === 'project_id');
    
    if (hasProjectId) {
      console.log('\n✅ project_id column already exists in production');
      return;
    }
    
    // Step 3: Add project_id column
    console.log('\n🔧 Adding project_id column...');
    await sql`
      ALTER TABLE teams 
      ADD COLUMN project_id INTEGER REFERENCES projects(id)
    `;
    
    console.log('✅ project_id column added successfully');
    
    // Step 4: Verify the change
    console.log('\n📊 Updated teams table structure:');
    const updatedColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `;
    
    updatedColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Step 5: Check existing teams
    console.log('\n📋 Current teams in production:');
    const teams = await sql`
      SELECT id, name, project_id, archived
      FROM teams 
      ORDER BY id
    `;
    
    teams.forEach(team => {
      console.log(`  ID ${team.id}: ${team.name} (project: ${team.project_id || 'NULL'}, archived: ${team.archived})`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. The /admin/collaborations/4 page should now work without 500 errors');
    console.log('2. You may want to assign projects to existing teams');
    console.log('3. Run "npm run db:compare" to verify schemas are in sync');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔍 Error details:', {
      message: error.message,
      code: error.code,
      severity: error.severity
    });
    
    if (error.code === '42701') {
      console.log('\n💡 The project_id column might already exist. Run the script again to check.');
    }
    
    process.exit(1);
  }
}

// Run the migration
addProjectIdToTeams();
