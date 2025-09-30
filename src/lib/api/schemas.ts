/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /docs/api/extension-proposal.md.
 */

import { z } from "zod";

// Base ID schemas
export const TimeEntryId = z.number().int().positive();
export const UserId = z.number().int().positive();
export const ProjectId = z.number().int().positive();
export const TaskId = z.number().int().positive();
export const ClientId = z.number().int().positive();

// Time entry schemas
export const TimeEntry = z.object({
  id: TimeEntryId,
  userId: UserId,
  taskId: TaskId,
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
  durationManual: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeEntryWithDetails = TimeEntry.extend({
  userName: z.string(),
  taskName: z.string(),
  projectName: z.string(),
  clientName: z.string(),
  duration: z.number().int().nonnegative(),
});

// Input schemas for API calls
export const CreateTimeEntryRequest = z.object({
  userId: UserId,
  taskId: TaskId,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationManual: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const UpdateTimeEntryRequest = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  durationManual: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const StartTimerRequest = z.object({
  taskId: TaskId,
  notes: z.string().optional(),
  clientTime: z.number().int().positive(), // Client timestamp
});

export const StopTimerRequest = z.object({
  timerId: z.number().int().positive(),
});

// Query parameter schemas
export const TimeEntriesQuery = z.object({
  userId: UserId.optional(),
  limit: z.number().int().positive().max(100).default(10),
});

// User schemas
export const User = z.object({
  id: UserId,
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'user']),
  status: z.enum(['active', 'inactive', 'pending']),
  payRate: z.number().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Project schemas
export const Project = z.object({
  id: ProjectId,
  clientId: ClientId,
  name: z.string(),
  archived: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Task schemas
export const Task = z.object({
  id: TaskId,
  projectId: ProjectId,
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'regular', 'high', 'urgent']),
  archived: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Client schemas
export const Client = z.object({
  id: ClientId,
  name: z.string(),
  createdBy: UserId,
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Timer schemas
export const OngoingTimer = z.object({
  id: z.number().int().positive(),
  userId: UserId,
  taskId: TaskId,
  startTime: z.string().datetime(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// Response schemas
export const ApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const TimeEntriesResponse = z.object({
  success: z.boolean(),
  data: z.array(TimeEntryWithDetails),
  error: z.string().optional(),
});

export const TimeEntryResponse = z.object({
  success: z.boolean(),
  data: TimeEntry,
  error: z.string().optional(),
});

// Type exports for TypeScript
export type TimeEntry = z.infer<typeof TimeEntry>;
export type TimeEntryWithDetails = z.infer<typeof TimeEntryWithDetails>;
export type CreateTimeEntryRequest = z.infer<typeof CreateTimeEntryRequest>;
export type UpdateTimeEntryRequest = z.infer<typeof UpdateTimeEntryRequest>;
export type StartTimerRequest = z.infer<typeof StartTimerRequest>;
export type StopTimerRequest = z.infer<typeof StopTimerRequest>;
export type TimeEntriesQuery = z.infer<typeof TimeEntriesQuery>;
export type User = z.infer<typeof User>;
export type Project = z.infer<typeof Project>;
export type Task = z.infer<typeof Task>;
export type Client = z.infer<typeof Client>;
export type OngoingTimer = z.infer<typeof OngoingTimer>;
export type ApiResponse = z.infer<typeof ApiResponse>;
export type TimeEntriesResponse = z.infer<typeof TimeEntriesResponse>;
export type TimeEntryResponse = z.infer<typeof TimeEntryResponse>;
