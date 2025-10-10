import { relations } from "drizzle-orm/relations";
import { 
  users, 
  clients, 
  tasks, 
  timeEntries, 
  projects, 
  sessions, 
  slackUsers, 
  taskAssignments,
  teams,
  teamMembers,
  taskCollaborations,
  taskDiscussions,
  taskFiles,
  taskLinks,
  taskNotes,
  notifications
} from "./schema";

export const clientsRelations = relations(clients, ({one, many}) => ({
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	projects: many(projects),
}));

export const usersRelations = relations(users, ({many}) => ({
	clients: many(clients),
	timeEntries: many(timeEntries),
	sessions: many(sessions),
	slackUsers: many(slackUsers),
	taskAssignments: many(taskAssignments),
	teams: many(teams),
	teamMemberships: many(teamMembers),
	taskCollaborations: many(taskCollaborations),
	taskDiscussions: many(taskDiscussions),
	taskFiles: many(taskFiles),
	taskLinks: many(taskLinks),
	taskNotes: many(taskNotes),
	notifications: many(notifications),
}));

export const timeEntriesRelations = relations(timeEntries, ({one}) => ({
	task: one(tasks, {
		fields: [timeEntries.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [timeEntries.userId],
		references: [users.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	timeEntries: many(timeEntries),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	taskAssignments: many(taskAssignments),
	taskCollaborations: many(taskCollaborations),
	taskDiscussions: many(taskDiscussions),
	taskFiles: many(taskFiles),
	taskLinks: many(taskLinks),
	taskNotes: many(taskNotes),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	tasks: many(tasks),
	client: one(clients, {
		fields: [projects.clientId],
		references: [clients.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const slackUsersRelations = relations(slackUsers, ({one}) => ({
	user: one(users, {
		fields: [slackUsers.userId],
		references: [users.id]
	}),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({one}) => ({
	task: one(tasks, {
		fields: [taskAssignments.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskAssignments.userId],
		references: [users.id]
	}),
}));

// Collaborative Features Relations

export const teamsRelations = relations(teams, ({one, many}) => ({
	creator: one(users, {
		fields: [teams.createdBy],
		references: [users.id]
	}),
	members: many(teamMembers),
	taskCollaborations: many(taskCollaborations),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
}));

export const taskCollaborationsRelations = relations(taskCollaborations, ({one}) => ({
	task: one(tasks, {
		fields: [taskCollaborations.taskId],
		references: [tasks.id]
	}),
	team: one(teams, {
		fields: [taskCollaborations.teamId],
		references: [teams.id]
	}),
	creator: one(users, {
		fields: [taskCollaborations.createdBy],
		references: [users.id]
	}),
}));

export const taskDiscussionsRelations = relations(taskDiscussions, ({one, many}) => ({
	task: one(tasks, {
		fields: [taskDiscussions.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskDiscussions.userId],
		references: [users.id]
	}),
	parent: one(taskDiscussions, {
		fields: [taskDiscussions.parentId],
		references: [taskDiscussions.id]
	}),
	replies: many(taskDiscussions),
}));

export const taskFilesRelations = relations(taskFiles, ({one}) => ({
	task: one(tasks, {
		fields: [taskFiles.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskFiles.userId],
		references: [users.id]
	}),
}));

export const taskLinksRelations = relations(taskLinks, ({one}) => ({
	task: one(tasks, {
		fields: [taskLinks.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskLinks.userId],
		references: [users.id]
	}),
}));

export const taskNotesRelations = relations(taskNotes, ({one}) => ({
	task: one(tasks, {
		fields: [taskNotes.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskNotes.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));