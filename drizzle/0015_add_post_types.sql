-- Add post type and media URL fields to task_discussions table
ALTER TABLE "task_discussions" ADD COLUMN "type" varchar(50) DEFAULT 'insight' NOT NULL;
ALTER TABLE "task_discussions" ADD COLUMN "media_url" varchar(500);
ALTER TABLE "task_discussions" ADD COLUMN "link_preview" jsonb;
ALTER TABLE "task_discussions" ADD COLUMN "subtask_data" jsonb;
