/**
 * Centralized time entry business logic service
 * Handles all time entry operations with consistent validation and timezone handling
 */

import { db } from '../db';
import { timeEntries, tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { TimeEntry, TimeEntryWithDetails, CreateTimeEntryRequest, UpdateTimeEntryRequest } from './types';
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

    // Check if there's an ongoing timer for this user (only for manual duration entries)
    if (request.duration) {
      const { timeEntries } = await import('../db/schema');
      const { eq, and, isNull } = await import('drizzle-orm');
      
      const ongoingTimer = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, request.userId),
            isNull(timeEntries.endTime),
            isNull(timeEntries.durationManual)
          )
        )
        .limit(1);

      if (ongoingTimer.length > 0) {
        throw new Error('Cannot create manual duration entry while timer is running. Please stop the timer first.');
      }
    }

    // Prepare time entry data
    const timeEntryData: any = {
      userId: request.userId,
      projectId: request.taskId, // Map taskId to projectId for database
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
      
      // Check if end time is earlier than start time (crosses midnight)
      const startTimeMinutes = request.startHours * 60 + request.startMinutes;
      const endTimeMinutes = request.endHours * 60 + request.endMinutes;
      const endDate = endTimeMinutes < startTimeMinutes 
        ? TimezoneService.getNextDay(request.taskDate!)
        : request.taskDate!;
      
      timeEntryData.endTime = TimezoneService.localToUTC(
        endDate,
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
      timeEntryData.startTime = null;        // Manual entries should have null startTime
      timeEntryData.endTime = null;          // Manual entries should have null endTime
      
      // For manual duration entries, use the taskDate for createdAt to associate with correct day
      if (request.taskDate) {
        const [year, month, day] = request.taskDate.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid timezone issues
        timeEntryData.createdAt = targetDate;
      }
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

    // Map projectId to taskId for backward compatibility
    return {
      ...newEntry,
      taskId: newEntry.projectId
    } as TimeEntry;
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

    // Handle start/end times - support partial updates
    if (request.startTime && request.endTime) {
      // Both ISO strings provided
      let startTime = TimezoneService.fromUserISOString(request.startTime);
      let endTime = TimezoneService.fromUserISOString(request.endTime);
      
      // If taskDate is provided, update the date part while preserving the time
      if (request.taskDate) {
        const [year, month, day] = request.taskDate.split('-').map(Number);
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        startTime = new Date(year, month - 1, day, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
        endTime = new Date(year, month - 1, day, endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
      }
      
      updateData.startTime = startTime;
      updateData.endTime = endTime;
      updateData.durationManual = TimezoneService.calculateDuration(
        updateData.startTime,
        updateData.endTime
      );
    } else if (typeof request.startHours === 'number' && typeof request.startMinutes === 'number' && 
               typeof request.endHours === 'number' && typeof request.endMinutes === 'number') {
      // Both component hours/minutes provided
      updateData.startTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.startHours,
        request.startMinutes,
        request.tzOffsetMinutes
      );
      
      // Check if end time is earlier than start time (crosses midnight)
      const startTimeMinutes = request.startHours * 60 + request.startMinutes;
      const endTimeMinutes = request.endHours * 60 + request.endMinutes;
      const endDate = endTimeMinutes < startTimeMinutes 
        ? TimezoneService.getNextDay(request.taskDate!)
        : request.taskDate!;
      
      updateData.endTime = TimezoneService.localToUTC(
        endDate,
        request.endHours,
        request.endMinutes,
        request.tzOffsetMinutes
      );
      updateData.durationManual = TimezoneService.calculateDuration(
        updateData.startTime,
        updateData.endTime
      );
    } else if (typeof request.startHours === 'number' && typeof request.startMinutes === 'number') {
      // Only start time provided - preserve existing end time
      updateData.startTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.startHours,
        request.startMinutes,
        request.tzOffsetMinutes
      );
      if (entry.endTime) {
        updateData.durationManual = TimezoneService.calculateDuration(
          updateData.startTime,
          entry.endTime
        );
      }
    } else if (typeof request.endHours === 'number' && typeof request.endMinutes === 'number') {
      // Only end time provided - preserve existing start time
      updateData.endTime = TimezoneService.localToUTC(
        request.taskDate!,
        request.endHours,
        request.endMinutes,
        request.tzOffsetMinutes
      );
      if (entry.startTime) {
        updateData.durationManual = TimezoneService.calculateDuration(
          entry.startTime,
          updateData.endTime
        );
      }
    } else if (request.startTime && !request.endTime) {
      // Only start time ISO string provided
      let startTime = TimezoneService.fromUserISOString(request.startTime);
      
      // If taskDate is provided, update the date part while preserving the time
      if (request.taskDate) {
        const [year, month, day] = request.taskDate.split('-').map(Number);
        const startDate = new Date(startTime);
        startTime = new Date(year, month - 1, day, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
      }
      
      updateData.startTime = startTime;
      if (entry.endTime) {
        updateData.durationManual = TimezoneService.calculateDuration(
          updateData.startTime,
          entry.endTime
        );
      }
    } else if (request.endTime && !request.startTime) {
      // Only end time ISO string provided
      let endTime = TimezoneService.fromUserISOString(request.endTime);
      
      // If taskDate is provided, update the date part while preserving the time
      if (request.taskDate) {
        const [year, month, day] = request.taskDate.split('-').map(Number);
        const endDate = new Date(endTime);
        endTime = new Date(year, month - 1, day, endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
      }
      
      updateData.endTime = endTime;
      if (entry.startTime) {
        updateData.durationManual = TimezoneService.calculateDuration(
          entry.startTime,
          updateData.endTime
        );
      }
    } else if (request.duration) {
      // Manual duration entry
      const durationSeconds = ValidationService.parseDuration(request.duration);
      updateData.durationManual = durationSeconds;
      updateData.startTime = request.taskDate 
        ? TimezoneService.createUserDate(request.taskDate, 12, 0)
        : entry.startTime;
      updateData.endTime = null;
    } else if (typeof request.durationManual === 'number') {
      // Direct duration manual entry
      updateData.durationManual = request.durationManual;
      updateData.startTime = request.taskDate 
        ? TimezoneService.createUserDate(request.taskDate, 12, 0)
        : entry.startTime;
      updateData.endTime = null;
    }

    // Handle createdAt updates for manual duration entries
    if (request.createdAt) {
      console.log('🔧 Service layer: Updating createdAt:', request.createdAt);
      updateData.createdAt = new Date(request.createdAt);
      console.log('🔧 Service layer: CreatedAt set to:', updateData.createdAt);
    }

    // Handle other fields
    if (request.taskId !== undefined) {
      updateData.projectId = request.taskId; // Map taskId to projectId for database
    }
    if (request.notes !== undefined) {
      updateData.notes = request.notes;
    }

    // Debug: Log what we're updating
    console.log('🔧 Service layer: Final updateData:', updateData);
    console.log('🔧 Service layer: Entry ID:', entryId);
    
    // Update the time entry
    let updatedEntry;
    try {
      console.log('🔧 Service layer: About to update database with:', updateData);
      [updatedEntry] = await db
        .update(timeEntries)
        .set(updateData)
        .where(eq(timeEntries.id, entryId))
        .returning();
        
      console.log('🔧 Service layer: Updated entry:', updatedEntry);
    } catch (dbError) {
      console.error('🔧 Service layer: Database update error:', dbError);
      throw dbError;
    }

    // Map projectId to taskId for backward compatibility
    return {
      ...updatedEntry,
      taskId: updatedEntry.projectId
    } as TimeEntry;
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

    return result.length > 0 ? {
      ...result[0],
      taskId: result[0].projectId
    } as TimeEntry : null;
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
        taskId: timeEntries.projectId, // Map projectId to taskId for backward compatibility
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt,
        userName: users.name,
        taskName: sql<string>`'General'`.as('taskName'), // Since we're now using projects as tasks
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
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, userId),
        sql`(${timeEntries.endTime} IS NOT NULL OR ${timeEntries.durationManual} IS NOT NULL)`,
        eq(clients.archived, false),
        eq(projects.archived, false)
      ))
      .orderBy(sql`COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}) DESC`)
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
        taskId: timeEntries.projectId, // Map projectId to taskId for backward compatibility
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt,
        userName: users.name,
        taskName: sql<string>`'General'`.as('taskName'), // Since we're now using projects as tasks
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
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(clients.archived, false),
        eq(projects.archived, false)
      ))
      .orderBy(sql`COALESCE(${timeEntries.startTime}, ${timeEntries.createdAt}) DESC`);

    return entries;
  }
}
