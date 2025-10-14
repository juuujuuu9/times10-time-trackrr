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

async function checkProductionStatus() {
  try {
    console.log('🔍 Checking production database status...');
    console.log('🔗 Database URL:', databaseUrl.substring(0, 30) + '...');
    
    // Check if old tables still exist
    console.log('⏳ Checking for old junction tables...');
    const oldTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('project_teams', 'task_collaborations')
      AND table_schema = 'public'
    `;
    
    if (oldTables.length > 0) {
      console.log('❌ Old junction tables still exist:', oldTables);
    } else {
      console.log('✅ Old junction tables successfully removed');
    }
    
    // Check if new columns exist
    console.log('⏳ Checking for new columns...');
    const teamColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'project_id'
    `;
    
    const taskColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'team_id'
    `;
    
    if (teamColumns.length > 0) {
      console.log('✅ teams.project_id column exists:', teamColumns[0]);
    } else {
      console.log('❌ teams.project_id column missing');
    }
    
    if (taskColumns.length > 0) {
      console.log('✅ tasks.team_id column exists:', taskColumns[0]);
    } else {
      console.log('❌ tasks.team_id column missing');
    }
    
    // Check foreign key constraints
    console.log('⏳ Checking foreign key constraints...');
    const constraints = await sql`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage 
      WHERE constraint_name IN ('teams_project_id_projects_id_fk', 'tasks_team_id_teams_id_fk')
    `;
    
    console.log('📊 Foreign key constraints:', constraints);
    
    // Test a simple query
    console.log('⏳ Testing team query...');
    try {
      const teams = await sql`SELECT id, name, project_id FROM teams LIMIT 3`;
      console.log('✅ Teams query successful:', teams);
    } catch (error) {
      console.log('❌ Teams query failed:', error.message);
    }
    
    // Test tasks query
    console.log('⏳ Testing tasks query...');
    try {
      const tasks = await sql`SELECT id, name, team_id FROM tasks WHERE team_id IS NOT NULL LIMIT 3`;
      console.log('✅ Tasks query successful:', tasks);
    } catch (error) {
      console.log('❌ Tasks query failed:', error.message);
    }
    
    console.log('🎉 Production status check completed!');
    
  } catch (error) {
    console.error('❌ Production status check failed:', error.message);
    process.exit(1);
  }
}

checkProductionStatus();
