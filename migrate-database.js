import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the column already exists
    const checkColumn = await client.query(`
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
    await client.query('ALTER TABLE time_entries RENAME COLUMN task_id TO project_id;');

    // Update the foreign key constraint
    console.log('Updating foreign key constraint...');
    await client.query('ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_tasks_id_fk;');
    await client.query('ALTER TABLE time_entries ADD CONSTRAINT time_entries_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrateDatabase();
