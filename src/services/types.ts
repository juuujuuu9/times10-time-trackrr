/**
 * TypeScript interfaces for time entry operations
 */

export interface TimeEntry {
  id: number;
  userId: number;
  taskId: number;
  startTime: Date | null;
  endTime: Date | null;
  durationManual: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryWithDetails extends TimeEntry {
  userName: string;
  taskName: string;
  projectName: string;
  clientName: string;
  duration: number; // Calculated duration in seconds
}

export interface CreateTimeEntryRequest {
  userId: number;
  taskId: number;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  startHours?: number;
  startMinutes?: number;
  endHours?: number;
  endMinutes?: number;
  taskDate?: string; // YYYY-MM-DD format
  tzOffsetMinutes?: number;
  duration?: string; // Duration string like "2h", "1.5hr"
  notes?: string;
}

export interface UpdateTimeEntryRequest {
  startTime?: string;
  endTime?: string;
  startHours?: number;
  startMinutes?: number;
  endHours?: number;
  endMinutes?: number;
  taskDate?: string;
  tzOffsetMinutes?: number;
  duration?: string;
  taskId?: number;
  notes?: string;
}

export interface ParsedTime {
  hours: number;
  minutes: number;
}

export interface TimezoneInfo {
  offsetMinutes: number;
  offsetHours: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
