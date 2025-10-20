/**
 * Centralized validation service for time entries
 */

import type { CreateTimeEntryRequest, UpdateTimeEntryRequest, ValidationResult, ParsedTime } from './types';

export class ValidationService {
  /**
   * Parse flexible time string (e.g., "9:30 AM", "5:30 PM", "930am")
   */
  static parseFlexibleTime(timeString: string): ParsedTime | null {
    if (!timeString || typeof timeString !== 'string') {
      return null;
    }

    // Remove extra spaces and convert to lowercase
    const cleanTime = timeString.trim().toLowerCase();
    
    // Handle various formats
    const patterns = [
      // 12:30 AM/PM
      /^(\d{1,2}):(\d{2})\s*(am|pm)$/,
      // 12:30A/12:30P
      /^(\d{1,2}):(\d{2})\s*(a|p)$/,
      // 1230 AM/PM
      /^(\d{3,4})\s*(am|pm)$/,
      // 1230A/1230P
      /^(\d{3,4})\s*(a|p)$/,
      // 12:30 (assume 24-hour if no AM/PM)
      /^(\d{1,2}):(\d{2})$/
    ];

    for (const pattern of patterns) {
      const match = cleanTime.match(pattern);
      if (match) {
        let hours: number;
        let minutes: number;
        const period = match[3] || match[4] || '';

        if (pattern.source.includes(':')) {
          // Format with colon
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
        } else {
          // Format without colon (e.g., 1230)
          const timeStr = match[1];
          if (timeStr.length === 3) {
            hours = parseInt(timeStr[0]);
            minutes = parseInt(timeStr.slice(1));
          } else {
            hours = parseInt(timeStr.slice(0, 2));
            minutes = parseInt(timeStr.slice(2));
          }
        }

        // Handle AM/PM
        if (period === 'am' || period === 'a') {
          if (hours === 12) hours = 0;
        } else if (period === 'pm' || period === 'p') {
          if (hours !== 12) hours += 12;
        }

        // Validate ranges
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return { hours, minutes };
        }
      }
    }

    return null;
  }

  /**
   * Parse duration string (e.g., "2h", "1.5hr", "90m", "4:15")
   */
  static parseDuration(durationString: string): number {
    if (!durationString || typeof durationString !== 'string') {
      throw new Error('Duration string is required');
    }

    const cleanDuration = durationString.trim().toLowerCase();
    
    // Handle hours (h, hr, hours)
    const hourMatch = cleanDuration.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hours?)$/);
    if (hourMatch) {
      return Math.floor(parseFloat(hourMatch[1]) * 3600);
    }

    // Handle minutes (m, min, minutes)
    const minuteMatch = cleanDuration.match(/^(\d+(?:\.\d+)?)\s*(m|min|minutes?)$/);
    if (minuteMatch) {
      return Math.floor(parseFloat(minuteMatch[1]) * 60);
    }

    // Handle seconds (s, sec, seconds)
    const secondMatch = cleanDuration.match(/^(\d+)\s*(s|sec|seconds?)$/);
    if (secondMatch) {
      return parseInt(secondMatch[1]);
    }

    // Handle MM:SS format
    const timeMatch = cleanDuration.match(/^(\d+):(\d{2})$/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      return minutes * 60 + seconds;
    }

    throw new Error(`Invalid duration format: ${durationString}. Use formats like "2h", "3.5hr", "4:15", "90m", "5400s"`);
  }

  /**
   * Validate create time entry request
   */
  static validateCreateRequest(request: CreateTimeEntryRequest): ValidationResult {
    if (!request.userId || !request.taskId) {
      return { isValid: false, error: 'User ID and task ID are required' };
    }

    // Check if we have start/end times or duration
    const hasStartEndTimes = (request.startTime && request.endTime) || 
                            (typeof request.startHours === 'number' && typeof request.startMinutes === 'number' && 
                             typeof request.endHours === 'number' && typeof request.endMinutes === 'number');
    const hasDuration = !!request.duration;

    if (!hasStartEndTimes && !hasDuration) {
      return { isValid: false, error: 'Either start/end times or duration must be provided' };
    }

    // If using component hours/minutes, taskDate is required
    if (typeof request.startHours === 'number' && !request.taskDate) {
      return { isValid: false, error: 'Task date is required when using start/end hours' };
    }

    // Validate duration format if provided
    if (hasDuration) {
      try {
        this.parseDuration(request.duration!);
      } catch (error) {
        return { isValid: false, error: error instanceof Error ? error.message : 'Invalid duration format' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate update time entry request
   */
  static validateUpdateRequest(request: UpdateTimeEntryRequest): ValidationResult {
    // Check if we have any time-related data (allow partial updates)
    const hasStartTime = request.startTime || (typeof request.startHours === 'number' && typeof request.startMinutes === 'number');
    const hasEndTime = request.endTime || (typeof request.endHours === 'number' && typeof request.endMinutes === 'number');
    const hasDuration = !!request.duration;
    const hasDurationManual = typeof request.durationManual === 'number';

    const hasCreatedAt = !!request.createdAt;
    
    if (!hasStartTime && !hasEndTime && !hasDuration && !hasDurationManual && !request.taskId && request.notes === undefined && !hasCreatedAt) {
      return { isValid: false, error: 'At least one field must be provided for update' };
    }

    // If using component hours/minutes, taskDate is required
    if (typeof request.startHours === 'number' && !request.taskDate) {
      return { isValid: false, error: 'Task date is required when using start/end hours' };
    }

    // Validate duration format if provided
    if (hasDuration) {
      try {
        this.parseDuration(request.duration!);
      } catch (error) {
        return { isValid: false, error: error instanceof Error ? error.message : 'Invalid duration format' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate that end time is after start time
   */
  static validateTimeOrder(startTime: Date, endTime: Date): ValidationResult {
    if (endTime <= startTime) {
      return { isValid: false, error: 'End time must be after start time' };
    }
    return { isValid: true };
  }
}
