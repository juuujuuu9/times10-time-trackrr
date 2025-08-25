import { relations } from "drizzle-orm/relations";
import { users, clients, tasks, timeEntries, projects, sessions, slackUsers, taskAssignments } from "./schema";

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