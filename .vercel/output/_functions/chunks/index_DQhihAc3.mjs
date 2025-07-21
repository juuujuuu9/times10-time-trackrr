import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { pgTable, timestamp, varchar, serial, boolean, integer, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const taskAssignments = pgTable("task_assignments", {
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull()
}, (table) => ({
  pk: primaryKey(table.taskId, table.userId)
}));
const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationManual: integer("duration_manual"),
  // in seconds, for manual time entry
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  taskAssignments: many(taskAssignments),
  timeEntries: many(timeEntries)
}));
const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id]
  }),
  projects: many(projects)
}));
const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id]
  }),
  tasks: many(tasks)
}));
const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  taskAssignments: many(taskAssignments),
  timeEntries: many(timeEntries)
}));
const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id]
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id]
  })
}));
const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id]
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id]
  })
}));

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  clients,
  clientsRelations,
  projects,
  projectsRelations,
  taskAssignments,
  taskAssignmentsRelations,
  tasks,
  tasksRelations,
  timeEntries,
  timeEntriesRelations,
  users,
  usersRelations
}, Symbol.toStringTag, { value: 'Module' }));

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
let databaseUrl;
if (typeof import.meta !== "undefined" && Object.assign(__vite_import_meta_env__, { DATABASE_URL: "postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require", _: process.env._ })) {
  databaseUrl = "postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
} else {
  databaseUrl = process.env.DATABASE_URL;
}
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

export { tasks as a, taskAssignments as b, clients as c, db as d, projects as p, timeEntries as t, users as u };
