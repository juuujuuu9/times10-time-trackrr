ALTER TABLE "projects" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;