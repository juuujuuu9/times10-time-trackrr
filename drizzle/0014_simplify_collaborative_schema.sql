-- Simplified Collaborative Schema Migration
-- Removes over-engineered junction tables and implements direct relationships
-- Following RULE-001: Simplicity First

-- Step 1: Add team_id to tasks table for direct team association
ALTER TABLE "tasks" ADD COLUMN "team_id" integer;

-- Step 2: Add project_id to teams table for direct project association  
ALTER TABLE "teams" ADD COLUMN "project_id" integer NOT NULL;

-- Step 3: Drop unnecessary junction tables
DROP TABLE IF EXISTS "project_teams" CASCADE;
DROP TABLE IF EXISTS "task_collaborations" CASCADE;

-- Step 4: Add foreign key constraints for simplified schema
ALTER TABLE "teams" ADD CONSTRAINT "teams_project_id_projects_id_fk" 
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_teams_id_fk" 
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Create indexes for performance
CREATE INDEX "idx_teams_project_id" ON "teams" ("project_id");
CREATE INDEX "idx_tasks_team_id" ON "tasks" ("team_id");

-- Step 6: Update existing foreign key constraints to use CASCADE for better data integrity
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_created_by_users_id_fk";
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_team_id_teams_id_fk";
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" 
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_user_id_users_id_fk";
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Update task-related foreign keys to use CASCADE
ALTER TABLE "task_discussions" DROP CONSTRAINT IF EXISTS "task_discussions_task_id_tasks_id_fk";
ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_task_id_tasks_id_fk" 
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_discussions" DROP CONSTRAINT IF EXISTS "task_discussions_user_id_users_id_fk";
ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_files" DROP CONSTRAINT IF EXISTS "task_files_task_id_tasks_id_fk";
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_task_id_tasks_id_fk" 
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_files" DROP CONSTRAINT IF EXISTS "task_files_user_id_users_id_fk";
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_links" DROP CONSTRAINT IF EXISTS "task_links_task_id_tasks_id_fk";
ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_tasks_id_fk" 
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_links" DROP CONSTRAINT IF EXISTS "task_links_user_id_users_id_fk";
ALTER TABLE "task_links" ADD CONSTRAINT "task_links_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_notes" DROP CONSTRAINT IF EXISTS "task_notes_task_id_tasks_id_fk";
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_task_id_tasks_id_fk" 
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_notes" DROP CONSTRAINT IF EXISTS "task_notes_user_id_users_id_fk";
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Update notifications foreign key
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
