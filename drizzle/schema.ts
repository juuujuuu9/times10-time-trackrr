import { pgTable, unique, serial, varchar, timestamp, numeric, foreignKey, integer, boolean, text, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('user').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	payRate: numeric("pay_rate", { precision: 10, scale:  2 }).default('0.00'),
	password: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const clients = pgTable("clients", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "clients_created_by_users_id_fk"
		}),
]);

export const timeEntries = pgTable("time_entries", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	userId: integer("user_id").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }),
	endTime: timestamp("end_time", { mode: 'string' }),
	durationManual: integer("duration_manual"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "time_entries_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "time_entries_user_id_users_id_fk"
		}),
]);

export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
	priority: varchar({ length: 20 }).default('regular').notNull(),
	isSystem: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_projects_id_fk"
		}),
]);

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	archived: boolean().default(false).notNull(),
	isSystem: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "projects_client_id_clients_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}),
	unique("sessions_token_unique").on(table.token),
]);

export const invitationTokens = pgTable("invitation_tokens", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("invitation_tokens_token_unique").on(table.token),
]);

export const slackCommands = pgTable("slack_commands", {
	id: serial().primaryKey().notNull(),
	command: varchar({ length: 100 }).notNull(),
	slackUserId: varchar("slack_user_id", { length: 255 }).notNull(),
	workspaceId: varchar("workspace_id", { length: 255 }).notNull(),
	channelId: varchar("channel_id", { length: 255 }).notNull(),
	text: text(),
	response: text(),
	success: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const slackWorkspaces = pgTable("slack_workspaces", {
	id: serial().primaryKey().notNull(),
	workspaceId: varchar("workspace_id", { length: 255 }).notNull(),
	workspaceName: varchar("workspace_name", { length: 255 }).notNull(),
	accessToken: varchar("access_token", { length: 1000 }).notNull(),
	botUserId: varchar("bot_user_id", { length: 255 }),
	botAccessToken: varchar("bot_access_token", { length: 1000 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("slack_workspaces_workspace_id_unique").on(table.workspaceId),
]);

export const slackUsers = pgTable("slack_users", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	slackUserId: varchar("slack_user_id", { length: 255 }).notNull(),
	workspaceId: varchar("workspace_id", { length: 255 }).notNull(),
	slackUsername: varchar("slack_username", { length: 255 }),
	slackEmail: varchar("slack_email", { length: 255 }),
	accessToken: varchar("access_token", { length: 1000 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "slack_users_user_id_users_id_fk"
		}),
]);

export const taskAssignments = pgTable("task_assignments", {
	taskId: integer("task_id").notNull(),
	userId: integer("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_assignments_task_id_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_assignments_user_id_users_id_fk"
		}),
	primaryKey({ columns: [table.taskId, table.userId], name: "task_assignments_task_id_user_id_pk"}),
]);
