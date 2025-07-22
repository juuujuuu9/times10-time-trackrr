/**
 * Parse time input in various formats and return duration in seconds
 * Supports formats like: "2h", "2hr", "3.5hr", "4:15", "90m", "5400s", etc.
 */
export function parseTimeInput(input: string): number {
  const trimmed = input.trim().toLowerCase();
  
  // Handle hours with various formats: "2h", "2hr", "2hours", "3.5h", etc.
  const hourMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours)$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return Math.round(hours * 3600);
  }
  
  // Handle minutes: "30m", "30min", "30minutes", etc.
  const minuteMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(m|min|minute|minutes)$/);
  if (minuteMatch) {
    const minutes = parseFloat(minuteMatch[1]);
    return Math.round(minutes * 60);
  }
  
  // Handle seconds: "3600s", "3600sec", "3600seconds", etc.
  const secondMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds)$/);
  if (secondMatch) {
    const seconds = parseFloat(secondMatch[1]);
    return Math.round(seconds);
  }
  
  // Handle time format: "4:15", "1:30:45", etc.
  const timeMatch = trimmed.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // Handle decimal hours: "2.5" (assumes hours)
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1]);
    return Math.round(hours * 3600);
  }
  
  throw new Error(`Invalid time format: ${input}. Supported formats: 2h, 2hr, 3.5hr, 4:15, 90m, 5400s, etc.`);
}

/**
 * Format seconds into a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingMinutes === 0 && remainingSeconds === 0) {
    return `${hours}h`;
  }
  
  if (remainingSeconds === 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

/**
 * Format seconds into hours with decimal places
 */
export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
} 