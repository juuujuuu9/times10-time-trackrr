import type { APIRoute } from 'astro';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requireRole } from '../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole('admin', '/admin')(context) as any;
    
    console.log('Starting safe database migration...');

    // Check if the column already exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' 
      AND column_name = 'project_id'
    `);

    if (checkColumn.rows.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'project_id column already exists' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Check for orphaned time entries (task_id that don't exist in projects)
    console.log('Checking for orphaned time entries...');
    const orphanedEntries = await db.execute(sql`
      SELECT te.id, te.task_id 
      FROM time_entries te 
      LEFT JOIN projects p ON te.task_id = p.id 
      WHERE p.id IS NULL
    `);

    if (orphanedEntries.rows.length > 0) {
      console.log(`Found ${orphanedEntries.rows.length} orphaned time entries`);
      // For now, we'll delete orphaned entries
      await db.execute(sql`
        DELETE FROM time_entries 
        WHERE id IN (
          SELECT te.id 
          FROM time_entries te 
          LEFT JOIN projects p ON te.task_id = p.id 
          WHERE p.id IS NULL
        )
      `);
      console.log('Deleted orphaned time entries');
    }

    // Step 2: Rename task_id to project_id
    console.log('Renaming task_id to project_id...');
    await db.execute(sql`ALTER TABLE time_entries RENAME COLUMN task_id TO project_id;`);

    // Step 3: Drop old foreign key constraint
    console.log('Dropping old foreign key constraint...');
    await db.execute(sql`ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_tasks_id_fk;`);

    // Step 4: Add new foreign key constraint
    console.log('Adding new foreign key constraint...');
    await db.execute(sql`ALTER TABLE time_entries ADD CONSTRAINT time_entries_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);`);

    console.log('Migration completed successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Migration completed successfully!' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
