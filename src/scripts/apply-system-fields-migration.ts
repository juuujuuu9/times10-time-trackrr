import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function applySystemFieldsMigration() {
  try {
    console.log('🔄 Applying system fields migration...');

    // Add is_system column to projects table
    console.log('📁 Adding is_system column to projects table...');
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL`);
    console.log('✅ Added is_system column to projects table');

    // Add is_system column to tasks table
    console.log('📋 Adding is_system column to tasks table...');
    await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL`);
    console.log('✅ Added is_system column to tasks table');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
applySystemFieldsMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
