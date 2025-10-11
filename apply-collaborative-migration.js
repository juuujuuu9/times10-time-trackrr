#!/usr/bin/env node

/**
 * Apply Collaborative Features Migration Directly
 * This script applies the migration using direct SQL execution
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';

console.log('🚀 Applying Collaborative Features Migration...');

async function applyMigration() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('✅ Database connection established');
    
    // Check current state
    console.log('\n📊 Checking current database state...');
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY table_name
    `;
    
    console.log('📋 Existing collaborative tables:');
    existingTables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    // Apply missing tables
    console.log('\n🔄 Creating missing collaborative tables...');
    
    // Create notifications table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "notifications" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "type" varchar(50) NOT NULL,
          "title" varchar(255) NOT NULL,
          "message" text NOT NULL,
          "related_id" integer,
          "related_type" varchar(50),
          "read" boolean DEFAULT false NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created notifications table');
    } catch (error) {
      console.log('⚠️  Notifications table already exists or error:', error.message);
    }
    
    // Create task_collaborations table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "task_collaborations" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL,
          "team_id" integer NOT NULL,
          "created_by" integer NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created task_collaborations table');
    } catch (error) {
      console.log('⚠️  Task collaborations table already exists or error:', error.message);
    }
    
    // Create task_discussions table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "task_discussions" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "content" text NOT NULL,
          "parent_id" integer,
          "archived" boolean DEFAULT false NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created task_discussions table');
    } catch (error) {
      console.log('⚠️  Task discussions table already exists or error:', error.message);
    }
    
    // Create task_files table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "task_files" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "filename" varchar(255) NOT NULL,
          "file_path" varchar(500) NOT NULL,
          "file_size" integer,
          "mime_type" varchar(100),
          "archived" boolean DEFAULT false NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created task_files table');
    } catch (error) {
      console.log('⚠️  Task files table already exists or error:', error.message);
    }
    
    // Create task_links table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "task_links" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "title" varchar(255) NOT NULL,
          "url" varchar(500) NOT NULL,
          "description" text,
          "archived" boolean DEFAULT false NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created task_links table');
    } catch (error) {
      console.log('⚠️  Task links table already exists or error:', error.message);
    }
    
    // Create task_notes table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "task_notes" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "title" varchar(255),
          "content" text NOT NULL,
          "is_private" boolean DEFAULT false NOT NULL,
          "archived" boolean DEFAULT false NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Created task_notes table');
    } catch (error) {
      console.log('⚠️  Task notes table already exists or error:', error.message);
    }
    
    // Add foreign key constraints
    console.log('\n🔗 Adding foreign key constraints...');
    
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
    
    for (const constraint of constraints) {
      try {
        await sql.unsafe(constraint.sql);
        console.log(`✅ Added constraint: ${constraint.name}`);
      } catch (error) {
        console.log(`⚠️  Constraint ${constraint.name} already exists or error: ${error.message}`);
      }
    }
    
    // Create indexes
    console.log('\n📈 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "idx_task_discussions_task_id" ON "task_discussions" ("task_id")',
      'CREATE INDEX IF NOT EXISTS "idx_task_discussions_parent_id" ON "task_discussions" ("parent_id")',
      'CREATE INDEX IF NOT EXISTS "idx_task_files_task_id" ON "task_files" ("task_id")',
      'CREATE INDEX IF NOT EXISTS "idx_task_links_task_id" ON "task_links" ("task_id")',
      'CREATE INDEX IF NOT EXISTS "idx_task_notes_task_id" ON "task_notes" ("task_id")',
      'CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id")',
      'CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read")',
      'CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at")'
    ];
    
    for (const indexSql of indexes) {
      try {
        await sql.unsafe(indexSql);
        console.log(`✅ Created index: ${indexSql.split('"')[1]}`);
      } catch (error) {
        console.log(`⚠️  Index already exists or error: ${error.message}`);
      }
    }
    
    // Verify final state
    console.log('\n🔍 Verifying migration...');
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications')
      ORDER BY table_name
    `;
    
    console.log('📋 All collaborative tables:');
    finalTables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    console.log('\n🎉 Collaborative features migration completed successfully!');
    console.log('🚀 You can now access the admin/collaborations page!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
