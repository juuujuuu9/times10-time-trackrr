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
  teamId: integer('team_id').references(() => teams.id), // Direct team association
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  priority: varchar('priority', { length: 20 }).notNull().default('regular'),
  dueDate: timestamp('due_date'), // Due date for the task
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
  projectId: integer('project_id').references(() => projects.id).notNull(),
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

// User Task Lists table (for storing user's curated task lists)
export const userTaskLists = pgTable('user_task_lists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Collaborative Features Tables

// Teams table for grouping users
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  projectId: integer('project_id').references(() => projects.id).notNull(), // Direct project association
  createdBy: integer('created_by').references(() => users.id).notNull(),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Team memberships
export const teamMembers = pgTable('team_members', {
  teamId: integer('team_id').references(() => teams.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'), // 'lead', 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey(table.teamId, table.userId),
}));

// Removed projectTeams and taskCollaborations - simplified to direct relationships

// Task discussions/comments
export const taskDiscussions = pgTable('task_discussions', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id').references(() => taskDiscussions.id), // For replies
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task files/attachments
export const taskFiles = pgTable('task_files', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Task links/resources
export const taskLinks = pgTable('task_links', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  description: text('description'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Task notes (enhanced from current notes)
export const taskNotes = pgTable('task_notes', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  isPrivate: boolean('is_private').notNull().default(false),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications for collaboration
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  relatedId: integer('related_id'),
  relatedType: varchar('related_type', { length: 50 }),
  read: boolean('read').notNull().default(false),
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
  userTaskLists: many(userTaskLists),
  teams: many(teams),
  teamMemberships: many(teamMembers),
  taskDiscussions: many(taskDiscussions),
  taskFiles: many(taskFiles),
  taskLinks: many(taskLinks),
  taskNotes: many(taskNotes),
  notifications: many(notifications),
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
  timeEntries: many(timeEntries),
  teams: many(teams), // Direct relationship to teams
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  taskAssignments: many(taskAssignments),
  taskDiscussions: many(taskDiscussions),
  taskFiles: many(taskFiles),
  taskLinks: many(taskLinks),
  taskNotes: many(taskNotes),
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
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
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

export const userTaskListsRelations = relations(userTaskLists, ({ one }) => ({
  user: one(users, {
    fields: [userTaskLists.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userTaskLists.taskId],
    references: [tasks.id],
  }),
}));

// Collaborative Features Relations

export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [teams.projectId],
    references: [projects.id],
  }),
  members: many(teamMembers),
  tasks: many(tasks), // Direct relationship to tasks
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// Removed projectTeamsRelations and taskCollaborationsRelations - simplified to direct relationships

export const taskDiscussionsRelations = relations(taskDiscussions, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskDiscussions.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskDiscussions.userId],
    references: [users.id],
  }),
  parent: one(taskDiscussions, {
    fields: [taskDiscussions.parentId],
    references: [taskDiscussions.id],
  }),
  replies: many(taskDiscussions),
}));

export const taskFilesRelations = relations(taskFiles, ({ one }) => ({
  task: one(tasks, {
    fields: [taskFiles.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskFiles.userId],
    references: [users.id],
  }),
}));

export const taskLinksRelations = relations(taskLinks, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLinks.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskLinks.userId],
    references: [users.id],
  }),
}));

export const taskNotesRelations = relations(taskNotes, ({ one }) => ({
  task: one(tasks, {
    fields: [taskNotes.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskNotes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
