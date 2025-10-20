/**
 * Centralized timezone handling service
 * Ensures consistent timezone conversion across the application
 */

import type { ParsedTime, TimezoneInfo } from './types';

export class TimezoneService {
  /**
   * Get current timezone offset information
   */
  static getTimezoneInfo(): TimezoneInfo {
    const offsetMinutes = new Date().getTimezoneOffset();
    return {
      offsetMinutes,
      offsetHours: offsetMinutes / 60
    };
  }

  /**
   * Convert local wall time to UTC using timezone offset
   * This preserves the user's intended wall time regardless of server timezone
   */
  static localToUTC(
    dateString: string, // YYYY-MM-DD
    hours: number,
    minutes: number,
    tzOffsetMinutes?: number
  ): Date {
    const dateObj = new Date(dateString);
    const offsetHours = (tzOffsetMinutes ?? this.getTimezoneInfo().offsetMinutes) / 60;
    // Subtract the offset to convert from local time to UTC
    const utcHours = hours - offsetHours;
    
    return new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      utcHours,
      minutes,
      0,
      0
    ));
  }

  /**
   * Create a date object that preserves the user's intended date
   * Used for manual duration entries where we only care about the date
   */
  static createUserDate(dateString: string, hours: number = 12, minutes: number = 0): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  }

  /**
   * Parse ISO string and create UTC date preserving intended date/time
   */
  static fromUserISOString(isoString: string): Date {
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }

  /**
   * Convert date to ISO string preserving intended date
   */
  static toUserISOString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  /**
   * Calculate duration between two dates in seconds
   */
  static calculateDuration(startTime: Date, endTime: Date): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  /**
   * Get today's date as YYYY-MM-DD string in user's timezone
   */
  static getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Get the next day's date as YYYY-MM-DD string
   */
  static getNextDay(dateString: string): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
