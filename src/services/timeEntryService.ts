/**
 * Centralized time entry business logic service
 * Handles all time entry operations with consistent validation and timezone handling
 */

import { db } from '../db';
import { timeEntries, tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { TimeEntry, TimeEntryWithDetails, CreateTimeEntryRequest, UpdateTimeEntryRequest } from './types';
import { TimezoneService } from './timezoneService';
import { ValidationService } from './validationService';

export class TimeEntryService {
  /**
   * Create a new time entry
   */
  static async createTimeEntry(request: CreateTimeEntryRequest): Promise<TimeEntry> {
    // Validate request
    const validation = ValidationService.validateCreateRequest(request);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Prepare time entry data
    const timeEntryData: any = {
      userId: request.userId,
      taskId: request.taskId,
      notes: request.notes || null,
    };

    // Handle start/end times
    if (request.startTime && request.endTime) {
      // ISO string format
      timeEntryData.startTime = TimezoneService.fromUserISOString(request.startTime);
      timeEntryData.endTime = TimezoneService.fromUserISOString(request.endTime);
      timeEntryData.durationManual = TimezoneService.calculateDuration(
        timeEntryData.startTime,
        timeEntryData.endTime
      );
    } else if (typeof request.startHours === 'number' && typeof request.startMinutes === 'number' && 
               typeof request.endHours === 'number' && typeof request.endMinutes === 'number') {
      // Component hours/minutes format
      timeEntryData.startTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.startHours,
        request.startMinutes,
        request.tzOffsetMinutes
      );
      timeEntryData.endTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.endHours,
        request.endMinutes,
        request.tzOffsetMinutes
      );
      timeEntryData.durationManual = TimezoneService.calculateDuration(
        timeEntryData.startTime,
        timeEntryData.endTime
      );
    } else if (request.duration) {
      // Manual duration entry
      const durationSeconds = ValidationService.parseDuration(request.duration);
      timeEntryData.durationManual = durationSeconds;
      timeEntryData.startTime = request.taskDate 
        ? TimezoneService.createUserDate(request.taskDate, 12, 0)
        : TimezoneService.createUserDate(TimezoneService.getTodayString(), 12, 0);
      timeEntryData.endTime = null;
    }

    // Create the time entry
    const [newEntry] = await db
      .insert(timeEntries)
      .values(timeEntryData)
      .returning();

    // Update task status to "in-progress" if it's currently "pending"
    await db
      .update(tasks)
      .set({ status: 'in-progress' })
      .where(
        and(
          eq(tasks.id, request.taskId),
          eq(tasks.status, 'pending')
        )
      );

    return newEntry;
  }

  /**
   * Update an existing time entry
   */
  static async updateTimeEntry(entryId: number, request: UpdateTimeEntryRequest): Promise<TimeEntry> {
    // Validate request
    const validation = ValidationService.validateUpdateRequest(request);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get current entry
    const currentEntry = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, entryId))
      .limit(1);

    if (currentEntry.length === 0) {
      throw new Error('Time entry not found');
    }

    const entry = currentEntry[0];

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    // Handle start/end times
    if (request.startTime && request.endTime) {
      // ISO string format
      updateData.startTime = TimezoneService.fromUserISOString(request.startTime);
      updateData.endTime = TimezoneService.fromUserISOString(request.endTime);
      updateData.durationManual = TimezoneService.calculateDuration(
        updateData.startTime,
        updateData.endTime
      );
    } else if (typeof request.startHours === 'number' && typeof request.startMinutes === 'number' && 
               typeof request.endHours === 'number' && typeof request.endMinutes === 'number') {
      // Component hours/minutes format
      updateData.startTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.startHours,
        request.startMinutes,
        request.tzOffsetMinutes
      );
      updateData.endTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.endHours,
        request.endMinutes,
        request.tzOffsetMinutes
      );
      updateData.durationManual = TimezoneService.calculateDuration(
        updateData.startTime,
        updateData.endTime
      );
    } else if (request.duration) {
      // Manual duration entry
      const durationSeconds = ValidationService.parseDuration(request.duration);
      updateData.durationManual = durationSeconds;
      updateData.startTime = request.taskDate 
        ? TimezoneService.createUserDate(request.taskDate, 12, 0)
        : entry.startTime;
      updateData.endTime = null;
    }

    // Handle other fields
    if (request.taskId !== undefined) {
      updateData.taskId = request.taskId;
    }
    if (request.notes !== undefined) {
      updateData.notes = request.notes;
    }

    // Update the time entry
    const [updatedEntry] = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, entryId))
      .returning();

    return updatedEntry;
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(entryId: number): Promise<void> {
    const result = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, entryId))
      .returning();

    if (result.length === 0) {
      throw new Error('Time entry not found');
    }
  }

  /**
   * Get time entry by ID
   */
  static async getTimeEntry(entryId: number): Promise<TimeEntry | null> {
    const result = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, entryId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get time entries for a user
   */
  static async getUserTimeEntries(userId: number, limit: number = 10): Promise<TimeEntryWithDetails[]> {
    const { sql } = await import('drizzle-orm');
    const { users, projects, clients } = await import('../db/schema');

    const entries = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        taskId: timeEntries.taskId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt,
        userName: users.name,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        duration: sql<number>`CASE 
          WHEN ${timeEntries.durationManual} IS NOT NULL 
          THEN ${timeEntries.durationManual}
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE 0
        END`.as('duration')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, userId),
        sql`(${timeEntries.endTime} IS NOT NULL OR ${timeEntries.durationManual} IS NOT NULL)`,
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false)
      ))
      .orderBy(sql`${timeEntries.createdAt} DESC`)
      .limit(limit);

    return entries;
  }

  /**
   * Get all time entries (admin)
   */
  static async getAllTimeEntries(): Promise<TimeEntryWithDetails[]> {
    const { sql } = await import('drizzle-orm');
    const { users, projects, clients } = await import('../db/schema');

    const entries = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        taskId: timeEntries.taskId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt,
        userName: users.name,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        duration: sql<number>`CASE 
          WHEN ${timeEntries.durationManual} IS NOT NULL 
          THEN ${timeEntries.durationManual}
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE 0
        END`.as('duration')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(clients.archived, false),
        eq(projects.archived, false),
        eq(tasks.archived, false)
      ))
      .orderBy(sql`${timeEntries.createdAt} DESC`);

    return entries;
  }
}
