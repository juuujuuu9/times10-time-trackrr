CREATE TABLE "slack_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"command" varchar(100) NOT NULL,
	"slack_user_id" varchar(255) NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"channel_id" varchar(255) NOT NULL,
	"text" text,
	"response" text,
	"success" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"slack_user_id" varchar(255) NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"slack_username" varchar(255),
	"slack_email" varchar(255),
	"access_token" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"workspace_name" varchar(255) NOT NULL,
	"access_token" varchar(1000) NOT NULL,
	"bot_user_id" varchar(255),
	"bot_access_token" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slack_workspaces_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "slack_users" ADD CONSTRAINT "slack_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;