/**
 * Get the most recent previous Sunday (start of the current week)
 * @returns Date object representing the start of the current week (Sunday)
 */
export function getWeekStartDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Sunday, subtract 0 days
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0); // Set to start of day
  
  return weekStart;
}

/**
 * Get the end of the current week (Saturday)
 * @returns Date object representing the end of the current week (Saturday)
 */
export function getWeekEndDate(): Date {
  const weekStart = getWeekStartDate();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get to Saturday
  weekEnd.setHours(23, 59, 59, 999); // Set to end of day
  
  return weekEnd;
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format a duration in seconds to decimal hours
 * @param seconds - Duration in seconds
 * @returns Decimal hours (e.g., 2.5 for 2 hours 30 minutes)
 */
export function formatDurationToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
} 