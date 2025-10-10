-- Teams table for grouping users
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);

-- Team memberships
CREATE TABLE IF NOT EXISTS "team_members" (
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);

-- Task collaboration enhancements
CREATE TABLE IF NOT EXISTS "task_collaborations" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Task discussions/comments
CREATE TABLE IF NOT EXISTS "task_discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);

-- Task files/attachments
CREATE TABLE IF NOT EXISTS "task_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);

-- Task links/resources
CREATE TABLE IF NOT EXISTS "task_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);

-- Task notes (enhanced from current notes)
CREATE TABLE IF NOT EXISTS "task_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);

-- Notifications for collaboration
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
);

-- Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Teams foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'teams_created_by_users_id_fk') THEN
        ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Team members foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_members_team_id_teams_id_fk') THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_members_user_id_users_id_fk') THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Task collaborations foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_collaborations_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_collaborations_team_id_teams_id_fk') THEN
        ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_collaborations_created_by_users_id_fk') THEN
        ALTER TABLE "task_collaborations" ADD CONSTRAINT "task_collaborations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Task discussions foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_discussions_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_discussions_user_id_users_id_fk') THEN
        ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_discussions_parent_id_task_discussions_id_fk') THEN
        ALTER TABLE "task_discussions" ADD CONSTRAINT "task_discussions_parent_id_task_discussions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."task_discussions"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Task files foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_files_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_files" ADD CONSTRAINT "task_files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_files_user_id_users_id_fk') THEN
        ALTER TABLE "task_files" ADD CONSTRAINT "task_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Task links foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_links_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_links_user_id_users_id_fk') THEN
        ALTER TABLE "task_links" ADD CONSTRAINT "task_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Task notes foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_notes_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_notes_user_id_users_id_fk') THEN
        ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    -- Notifications foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_users_id_fk') THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS "idx_team_members_user_id" ON "team_members" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_team_members_team_id" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_task_discussions_task_id" ON "task_discussions" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_discussions_parent_id" ON "task_discussions" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_task_files_task_id" ON "task_files" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_links_task_id" ON "task_links" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_notes_task_id" ON "task_notes" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at");
