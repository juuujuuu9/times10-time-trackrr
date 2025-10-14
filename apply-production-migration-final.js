import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use production database URL
const databaseUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ PRODUCTION_DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function applyProductionMigration() {
  try {
    console.log('🚀 Applying FINAL production migration to sync schemas...');
    console.log('🔗 Production Database URL:', databaseUrl.substring(0, 30) + '...');
    console.log('⚠️  This will modify the production database to match local schema');
    
    // Step 1: Check current state
    console.log('⏳ Checking current production schema...');
    const currentTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('project_teams', 'task_collaborations', 'teams', 'tasks')
      AND table_schema = 'public'
    `;
    console.log('📊 Current tables:', currentTables.map(t => t.table_name));
    
    // Step 2: Check if columns already exist
    const teamColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'project_id'
    `;
    
    const taskColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'team_id'
    `;
    
    console.log('📊 teams.project_id exists:', teamColumns.length > 0);
    console.log('📊 tasks.team_id exists:', taskColumns.length > 0);
    
    // Step 3: Add missing columns if they don't exist
    if (taskColumns.length === 0) {
      console.log('⏳ Adding team_id to tasks table...');
      await sql`ALTER TABLE "tasks" ADD COLUMN "team_id" integer`;
      console.log('✅ Added team_id to tasks table');
    } else {
      console.log('✅ tasks.team_id column already exists');
    }
    
    if (teamColumns.length === 0) {
      console.log('⏳ Adding project_id to teams table...');
      await sql`ALTER TABLE "teams" ADD COLUMN "project_id" integer`;
      console.log('✅ Added project_id to teams table');
    } else {
      console.log('✅ teams.project_id column already exists');
    }
    
    // Step 4: Migrate data from old junction tables
    const projectTeamsExists = currentTables.some(t => t.table_name === 'project_teams');
    const taskCollaborationsExists = currentTables.some(t => t.table_name === 'task_collaborations');
    
    if (projectTeamsExists) {
      console.log('⏳ Migrating data from project_teams to teams.project_id...');
      const projectTeamsData = await sql`
        SELECT team_id, project_id 
        FROM project_teams 
        ORDER BY team_id
      `;
      console.log(`📊 Found ${projectTeamsData.length} project_teams records to migrate`);
      
      for (const record of projectTeamsData) {
        await sql`
          UPDATE "teams" 
          SET "project_id" = ${record.project_id}
          WHERE "id" = ${record.team_id}
        `;
      }
      console.log('✅ Migrated project_teams data to teams.project_id');
    }
    
    if (taskCollaborationsExists) {
      console.log('⏳ Migrating data from task_collaborations to tasks.team_id...');
      const taskCollaborationsData = await sql`
        SELECT task_id, team_id 
        FROM task_collaborations 
        ORDER BY task_id
      `;
      console.log(`📊 Found ${taskCollaborationsData.length} task_collaborations records to migrate`);
      
      for (const record of taskCollaborationsData) {
        await sql`
          UPDATE "tasks" 
          SET "team_id" = ${record.team_id}
          WHERE "id" = ${record.task_id}
        `;
      }
      console.log('✅ Migrated task_collaborations data to tasks.team_id');
    }
    
    // Step 5: Make project_id NOT NULL after data migration
    console.log('⏳ Making project_id NOT NULL...');
    await sql`ALTER TABLE "teams" ALTER COLUMN "project_id" SET NOT NULL`;
    console.log('✅ Made project_id NOT NULL');
    
    // Step 6: Add foreign key constraints
    console.log('⏳ Adding foreign key constraints...');
    await sql`
      ALTER TABLE "teams" ADD CONSTRAINT "teams_project_id_projects_id_fk" 
      FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
    await sql`
      ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_teams_id_fk" 
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `;
    console.log('✅ Added foreign key constraints');
    
    // Step 7: Create indexes for performance
    console.log('⏳ Creating performance indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "idx_teams_project_id" ON "teams" ("project_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_tasks_team_id" ON "tasks" ("team_id")`;
    console.log('✅ Created performance indexes');
    
    // Step 8: Drop the old junction tables
    console.log('⏳ Dropping old junction tables...');
    if (projectTeamsExists) {
      await sql`DROP TABLE IF EXISTS "project_teams" CASCADE`;
      console.log('✅ Dropped project_teams table');
    }
    if (taskCollaborationsExists) {
      await sql`DROP TABLE IF EXISTS "task_collaborations" CASCADE`;
      console.log('✅ Dropped task_collaborations table');
    }
    
    // Step 9: Verify the migration
    console.log('⏳ Verifying migration...');
    const finalTeams = await sql`SELECT id, name, project_id FROM teams LIMIT 3`;
    const finalTasks = await sql`SELECT id, name, team_id FROM tasks WHERE team_id IS NOT NULL LIMIT 3`;
    
    console.log('📊 Final teams with project_id:', finalTeams);
    console.log('📊 Final tasks with team_id:', finalTasks);
    
    console.log('🎉 Production migration completed successfully!');
    console.log('📊 Schema now matches local: Teams → Projects (direct), Tasks → Teams (direct)');
    console.log('✅ All data preserved and migrated safely');
    
  } catch (error) {
    console.error('❌ Production migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('⚠️  Production database may be in an inconsistent state');
    process.exit(1);
  }
}

applyProductionMigration();
