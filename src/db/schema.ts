import { pgTable, serial, text, timestamp, integer, varchar, time, primaryKey, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(), // Hashed password
  role: varchar('role', { length: 50 }).notNull().default('user'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  payRate: decimal('pay_rate', { precision: 10, scale: 2 }).default('0.00'), // Hourly rate in USD
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table for authentication
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  archived: boolean('archived').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false), // Mark system-generated projects
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  priority: varchar('priority', { length: 20 }).notNull().default('regular'),
  archived: boolean('archived').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false), // Mark system-generated tasks
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task assignments junction table
export const taskAssignments = pgTable('task_assignments', {
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
}, (table) => ({
  pk: primaryKey(table.taskId, table.userId),
}));

// Time entries table
export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  durationManual: integer('duration_manual'), // in seconds, for manual time entry
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invitation tokens table for email invitations
export const invitationTokens = pgTable('invitation_tokens', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Slack Workspaces table
export const slackWorkspaces = pgTable('slack_workspaces', {
  id: serial('id').primaryKey(),
  workspaceId: varchar('workspace_id', { length: 255 }).notNull().unique(),
  workspaceName: varchar('workspace_name', { length: 255 }).notNull(),
  accessToken: varchar('access_token', { length: 1000 }).notNull(),
  botUserId: varchar('bot_user_id', { length: 255 }),
  botAccessToken: varchar('bot_access_token', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Slack Users table (links Slack users to your app users)
export const slackUsers = pgTable('slack_users', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  slackUserId: varchar('slack_user_id', { length: 255 }).notNull(),
  workspaceId: varchar('workspace_id', { length: 255 }).notNull(),
  slackUsername: varchar('slack_username', { length: 255 }),
  slackEmail: varchar('slack_email', { length: 255 }),
  accessToken: varchar('access_token', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Slack Commands table (for tracking command usage)
export const slackCommands = pgTable('slack_commands', {
  id: serial('id').primaryKey(),
  command: varchar('command', { length: 100 }).notNull(),
  slackUserId: varchar('slack_user_id', { length: 255 }).notNull(),
  workspaceId: varchar('workspace_id', { length: 255 }).notNull(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  text: text('text'),
  response: text('response'),
  success: boolean('success').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  taskAssignments: many(taskAssignments),
  timeEntries: many(timeEntries),
  sessions: many(sessions),
  slackUsers: many(slackUsers),
  passwordResetTokens: many(passwordResetTokens),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  taskAssignments: many(taskAssignments),
  timeEntries: many(timeEntries),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const slackUsersRelations = relations(slackUsers, ({ one }) => ({
  user: one(users, {
    fields: [slackUsers.userId],
    references: [users.id],
  }),
}));

export const slackWorkspacesRelations = relations(slackWorkspaces, ({ many }) => ({
  slackUsers: many(slackUsers),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
})); 