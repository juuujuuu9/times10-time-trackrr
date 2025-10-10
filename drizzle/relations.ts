import { relations } from "drizzle-orm/relations";
import { users, slackUsers, userTaskLists, tasks, teams, taskCollaborations, taskFiles, taskLinks, taskNotes, notifications, taskDiscussions, sessions, projects, clients, timeEntries, passwordResetTokens, taskAssignments, projectTeams, teamMembers } from "./schema";

export const slackUsersRelations = relations(slackUsers, ({one}) => ({
	user: one(users, {
		fields: [slackUsers.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	slackUsers: many(slackUsers),
	userTaskLists: many(userTaskLists),
	teams: many(teams),
	taskCollaborations: many(taskCollaborations),
	taskFiles: many(taskFiles),
	taskLinks: many(taskLinks),
	taskNotes: many(taskNotes),
	notifications: many(notifications),
	taskDiscussions: many(taskDiscussions),
	sessions: many(sessions),
	clients: many(clients),
	timeEntries: many(timeEntries),
	passwordResetTokens: many(passwordResetTokens),
	taskAssignments: many(taskAssignments),
	projectTeams: many(projectTeams),
	teamMembers: many(teamMembers),
}));

export const userTaskListsRelations = relations(userTaskLists, ({one}) => ({
	user: one(users, {
		fields: [userTaskLists.userId],
		references: [users.id]
	}),
	task: one(tasks, {
		fields: [userTaskLists.taskId],
		references: [tasks.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	userTaskLists: many(userTaskLists),
	taskCollaborations: many(taskCollaborations),
	taskFiles: many(taskFiles),
	taskLinks: many(taskLinks),
	taskNotes: many(taskNotes),
	taskDiscussions: many(taskDiscussions),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	taskAssignments: many(taskAssignments),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	user: one(users, {
		fields: [teams.createdBy],
		references: [users.id]
	}),
	taskCollaborations: many(taskCollaborations),
	projectTeams: many(projectTeams),
	teamMembers: many(teamMembers),
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
	user: one(users, {
		fields: [taskCollaborations.createdBy],
		references: [users.id]
	}),
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

export const taskDiscussionsRelations = relations(taskDiscussions, ({one, many}) => ({
	task: one(tasks, {
		fields: [taskDiscussions.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskDiscussions.userId],
		references: [users.id]
	}),
	taskDiscussion: one(taskDiscussions, {
		fields: [taskDiscussions.parentId],
		references: [taskDiscussions.id],
		relationName: "taskDiscussions_parentId_taskDiscussions_id"
	}),
	taskDiscussions: many(taskDiscussions, {
		relationName: "taskDiscussions_parentId_taskDiscussions_id"
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	tasks: many(tasks),
	client: one(clients, {
		fields: [projects.clientId],
		references: [clients.id]
	}),
	timeEntries: many(timeEntries),
	projectTeams: many(projectTeams),
}));

export const clientsRelations = relations(clients, ({one, many}) => ({
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	projects: many(projects),
}));

export const timeEntriesRelations = relations(timeEntries, ({one}) => ({
	user: one(users, {
		fields: [timeEntries.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [timeEntries.projectId],
		references: [projects.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
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

export const projectTeamsRelations = relations(projectTeams, ({one}) => ({
	project: one(projects, {
		fields: [projectTeams.projectId],
		references: [projects.id]
	}),
	team: one(teams, {
		fields: [projectTeams.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [projectTeams.assignedBy],
		references: [users.id]
	}),
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