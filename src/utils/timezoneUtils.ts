/**
 * Timezone utilities for consistent date/time handling across the application
 * This ensures that time entries maintain their intended date regardless of server timezone
 */

/**
 * Creates a date object that preserves the user's intended date and time
 * without being affected by server timezone conversions
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param seconds - Seconds (0-59), defaults to 0
 * @returns Date object that represents the exact date/time intended by the user
 */
export function createUserDate(dateString: string, hours: number, minutes: number, seconds: number = 0): Date {
  // Parse the date components to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date in UTC to avoid local timezone interference
  // This ensures the date stays exactly as the user intended
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  
  return date;
}

/**
 * Creates a date object from a task date and time components
 * This is the main function to use when creating time entries
 * 
 * @param taskDate - Date object or date string representing the task date
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Date object that preserves the user's intended date/time
 */
export function createTaskDateTime(taskDate: Date | string, hours: number, minutes: number): Date {
  let dateString: string;
  
  if (taskDate instanceof Date) {
    // Convert to YYYY-MM-DD format, using the date as-is (no timezone conversion)
    const { year, month, day } = getDateComponents(taskDate);
    dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } else {
    dateString = taskDate;
  }
  
  return createUserDate(dateString, hours, minutes);
}

/**
 * Extracts date components from a date object without timezone conversion
 * This ensures we get the actual date the user sees, not a timezone-adjusted date
 * 
 * @param date - Date object
 * @returns Object with year, month, day components
 */
export function getDateComponents(date: Date): { year: number; month: number; day: number } {
  // Use UTC methods to avoid timezone conversion issues
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

/**
 * Formats a date for display in the user's local timezone
 * This should be used for all date displays to ensure consistency
 * 
 * @param date - Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return date.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Formats a time for display in the user's local timezone
 * This should be used for all time displays to ensure consistency
 * 
 * @param date - Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export function formatTimeForDisplay(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  return date.toLocaleTimeString(undefined, defaultOptions);
}

/**
 * Gets the start of day for a given date in the user's timezone
 * This is useful for date range queries
 * 
 * @param date - Date object
 * @returns Date object representing start of day (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
  const { year, month, day } = getDateComponents(date);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Gets the end of day for a given date in the user's timezone
 * This is useful for date range queries
 * 
 * @param date - Date object
 * @returns Date object representing end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  const { year, month, day } = getDateComponents(date);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Converts a date to ISO string while preserving the intended date
 * This should be used instead of toISOString() when the date represents
 * a user's intended date/time rather than an actual moment in time
 * 
 * @param date - Date object
 * @returns ISO string that preserves the user's intended date
 */
export function toUserISOString(date: Date): string {
  // For time entries, we want to preserve the user's intended date
  // So we use the date components directly without timezone conversion
  const { year, month, day } = getDateComponents(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hours}:${minutes}:${seconds}.000Z`;
}

/**
 * Parses a date string that was created with toUserISOString
 * This ensures we get back the exact date the user intended
 * 
 * @param isoString - ISO string created with toUserISOString
 * @returns Date object representing the user's intended date
 */
export function fromUserISOString(isoString: string): Date {
  // Parse the ISO string and create a date in UTC to avoid timezone issues
  const date = new Date(isoString);
  
  // Extract the date components to ensure we get the intended date
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Gets today's date as a string in YYYY-MM-DD format
 * This should be used for date inputs to ensure consistency
 * Uses the user's local timezone, not the server's timezone
 * 
 * @returns Today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  const today = new Date();
  // Use local date components to get the user's actual "today"
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Validates that a date string is in the correct YYYY-MM-DD format
 * 
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}
