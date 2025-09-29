import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');

    // Check if the column already exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' 
      AND column_name = 'project_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('project_id column already exists');
      return;
    }

    // Rename task_id to project_id
    console.log('Renaming task_id to project_id...');
    await db.execute(sql`ALTER TABLE time_entries RENAME COLUMN task_id TO project_id;`);

    // Update the foreign key constraint
    console.log('Updating foreign key constraint...');
    await db.execute(sql`ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_tasks_id_fk;`);
    await db.execute(sql`ALTER TABLE time_entries ADD CONSTRAINT time_entries_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateDatabase();
