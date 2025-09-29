-- Rename task_id to project_id in time_entries table
ALTER TABLE "time_entries" RENAME COLUMN "task_id" TO "project_id";

-- Update the foreign key constraint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_task_id_tasks_id_fk";
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id");
