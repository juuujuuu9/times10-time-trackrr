import { db } from './src/db/index.ts';
import { readFileSync } from 'fs';

try {
  console.log('Running collaborative features migration...');
  
  const sql = readFileSync('create-collaborative-tables.sql', 'utf8');
  
  // Split the SQL into individual statements
  const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.trim().substring(0, 50) + '...');
      await db.execute(statement);
    }
  }
  
  console.log('✅ Collaborative features migration completed successfully!');
  console.log('📊 Created tables:');
  console.log('  - teams');
  console.log('  - team_members');
  console.log('  - task_collaborations');
  console.log('  - task_discussions');
  console.log('  - task_files');
  console.log('  - task_links');
  console.log('  - task_notes');
  console.log('  - notifications');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
