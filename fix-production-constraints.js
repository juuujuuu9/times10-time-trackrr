#!/usr/bin/env node

/**
 * Fix Production Database Constraints
 * This script adds any missing foreign key constraints to the production database
 */

import { neon } from '@neondatabase/serverless';

console.log('🔧 Fixing Production Database Constraints...');

async function fixConstraints() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Check current foreign key constraints
    console.log('\n📊 Checking current foreign key constraints...');
    const currentConstraints = await sql`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tc.table_name
    `;
    
    console.log(`Found ${currentConstraints.length} foreign key constraints:`);
    currentConstraints.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Add missing foreign key constraints
    console.log('\n🔗 Adding missing foreign key constraints...');
    
    const constraints = [
      {
        name: 'notifications_user_id_users_id_fk',
        sql: `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_collaborations_task_id_tasks_id_fk',
        sql: `ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_collaborations_team_id_teams_id_fk',
        sql: `ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_collaborations_created_by_users_id_fk',
        sql: `ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_discussions_task_id_tasks_id_fk',
        sql: `ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_discussions_user_id_users_id_fk',
        sql: `ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_discussions_parent_id_task_discussions_id_fk',
        sql: `ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_parent_id_task_discussions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."task_discussions"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_files_task_id_tasks_id_fk',
        sql: `ALTER TABLE "task_files" ADD CONSTRAINT "task_files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_files_user_id_users_id_fk',
        sql: `ALTER TABLE "task_files" ADD CONSTRAINT "task_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_links_task_id_tasks_id_fk',
        sql: `ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_links_user_id_users_id_fk',
        sql: `ALTER TABLE "task_links" ADD CONSTRAINT "task_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_notes_task_id_tasks_id_fk',
        sql: `ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action`
      },
      {
        name: 'task_notes_user_id_users_id_fk',
        sql: `ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`
      }
    ];
    
    let addedCount = 0;
    for (const constraint of constraints) {
      try {
        await sql.unsafe(constraint.sql);
        console.log(`✅ Added constraint: ${constraint.name}`);
        addedCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Constraint ${constraint.name} already exists`);
        } else {
          console.log(`❌ Failed to add constraint ${constraint.name}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📊 Added ${addedCount} new foreign key constraints`);
    
    // Verify final state
    console.log('\n🔍 Verifying final constraints...');
    const finalConstraints = await sql`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY tc.table_name
    `;
    
    console.log(`Final constraint count: ${finalConstraints.length}`);
    finalConstraints.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    console.log('\n🎉 Database constraints fixed successfully!');
    console.log('The collaborations page should now work correctly.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Constraint fix failed:', error);
    return false;
  }
}

// Run the fix
fixConstraints()
  .then(success => {
    if (success) {
      console.log('\n✅ Database constraints are now properly configured');
    } else {
      console.log('\n❌ Failed to fix database constraints');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Constraint fix error:', error);
    process.exit(1);
  });
