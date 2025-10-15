-- Add support for multiple media files in task_discussions
ALTER TABLE "task_discussions" ADD COLUMN "media_urls" text;
ALTER TABLE "task_discussions" ADD COLUMN "file_names" text;
