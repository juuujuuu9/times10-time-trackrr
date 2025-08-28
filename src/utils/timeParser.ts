/**
 * Parse time input in various formats and return duration in seconds
 * Supports formats like: "2h", "2hr", "3.5hr", "4:15", "90m", "5400s", etc.
 */
export function parseTimeInput(input: string): number {
  // Basic input validation
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('Input cannot be empty');
  }
  
  const trimmedLower = trimmed.toLowerCase();
  
  // Handle hours with various formats: "2h", "2hr", "2hours", "3.5h", etc.
  const hourMatch = trimmedLower.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours)$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    const result = Math.round(hours * 3600);
    
    // Validate result bounds
    if (result < 0 || result > 24 * 3600) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  // Handle minutes: "30m", "30min", "30minutes", etc.
  const minuteMatch = trimmedLower.match(/^(\d+(?:\.\d+)?)\s*(m|min|minute|minutes)$/);
  if (minuteMatch) {
    const minutes = parseFloat(minuteMatch[1]);
    const result = Math.round(minutes * 60);
    
    // Validate result bounds (max 24 hours in minutes)
    if (result < 0 || result > 24 * 60) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  // Handle seconds: "3600s", "3600sec", "3600seconds", etc.
  const secondMatch = trimmedLower.match(/^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds)$/);
  if (secondMatch) {
    const seconds = parseFloat(secondMatch[1]);
    const result = Math.round(seconds);
    
    // Validate result bounds (max 24 hours in seconds)
    if (result < 0 || result > 24 * 3600) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  // Handle time format: "4:15", "1:30:45", etc.
  const timeMatch = trimmedLower.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    const result = hours * 3600 + minutes * 60 + seconds;
    
    // Validate result bounds
    if (result < 0 || result > 24 * 3600) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  // Handle combined hours and minutes: "0h 30m", "2h 15m", etc.
  const combinedMatch = trimmedLower.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours)\s+(\d+(?:\.\d+)?)\s*(m|min|minute|minutes)(?:\s+(\d+(?:\.\d+)?)\s*(s|sec|second|seconds))?$/);
  if (combinedMatch) {
    const hours = parseFloat(combinedMatch[1]);
    const minutes = parseFloat(combinedMatch[3]);
    const seconds = combinedMatch[5] ? parseFloat(combinedMatch[5]) : 0;
    const result = Math.round(hours * 3600 + minutes * 60 + seconds);
    
    // Validate result bounds
    if (result < 0 || result > 24 * 3600) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  // Handle decimal hours: "2.5" (assumes hours)
  const decimalMatch = trimmedLower.match(/^(\d+(?:\.\d+)?)$/);
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1]);
    const result = Math.round(hours * 3600);
    
    // Validate result bounds
    if (result < 0 || result > 24 * 3600) {
      throw new Error('Duration must be between 0 and 24 hours');
    }
    
    return result;
  }
  
  throw new Error(`Invalid time format: ${input}. Supported formats: 2h, 2hr, 3.5hr, 4:15, 90m, 5400s, 0h 30m, etc.`);
}

/**
 * Parse time input in various formats and return a Date object for a specific date
 * Supports formats like: "12p", "12:30am", "1230 p", "12:00 PM", "12am", etc.
 */
export function parseTimeString(timeInput: string, baseDate: Date = new Date()): Date {
  const trimmed = timeInput.trim().toLowerCase();
  
  // Create a new date object based on the base date
  const resultDate = new Date(baseDate);
  
  // Handle various time formats
  let hours = 0;
  let minutes = 0;
  let isPM = false;
  
  // Pattern 1: "12p", "12pm", "12:30p", "12:30pm"
  const pmPattern1 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(p|pm)$/);
  if (pmPattern1) {
    hours = parseInt(pmPattern1[1]);
    minutes = pmPattern1[2] ? parseInt(pmPattern1[2]) : 0;
    isPM = true;
  }
  
  // Pattern 2: "12a", "12am", "12:30a", "12:30am"
  const amPattern1 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(a|am)$/);
  if (amPattern1) {
    hours = parseInt(amPattern1[1]);
    minutes = amPattern1[2] ? parseInt(amPattern1[2]) : 0;
    isPM = false;
  }
  
  // Pattern 3: "12 p", "12 pm", "12:30 p", "12:30 pm"
  const pmPattern2 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s+(p|pm)$/);
  if (pmPattern2) {
    hours = parseInt(pmPattern2[1]);
    minutes = pmPattern2[2] ? parseInt(pmPattern2[2]) : 0;
    isPM = true;
  }
  
  // Pattern 4: "12 a", "12 am", "12:30 a", "12:30 am"
  const amPattern2 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s+(a|am)$/);
  if (amPattern2) {
    hours = parseInt(amPattern2[1]);
    minutes = amPattern2[2] ? parseInt(amPattern2[2]) : 0;
    isPM = false;
  }
  
  // Pattern 5: "12:00 PM", "12:00 AM"
  const fullPattern = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (fullPattern) {
    hours = parseInt(fullPattern[1]);
    minutes = parseInt(fullPattern[2]);
    isPM = fullPattern[3] === 'pm';
  }
  
  // Pattern 6: "1230p", "1230pm", "1230a", "1230am" (4-digit format)
  const fourDigitPattern = trimmed.match(/^(\d{4})(a|am|p|pm)$/);
  if (fourDigitPattern) {
    const timeStr = fourDigitPattern[1];
    hours = parseInt(timeStr.substring(0, 2));
    minutes = parseInt(timeStr.substring(2, 4));
    isPM = fourDigitPattern[2].startsWith('p');
  }
  
  // Pattern 7: "1230 p", "1230 pm", "1230 a", "1230 am" (4-digit with space)
  const fourDigitSpacePattern = trimmed.match(/^(\d{4})\s+(a|am|p|pm)$/);
  if (fourDigitSpacePattern) {
    const timeStr = fourDigitSpacePattern[1];
    hours = parseInt(timeStr.substring(0, 2));
    minutes = parseInt(timeStr.substring(2, 4));
    isPM = fourDigitSpacePattern[2].startsWith('p');
  }
  
  // Pattern 8: "12:00" (24-hour format)
  const twentyFourHourPattern = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourPattern) {
    hours = parseInt(twentyFourHourPattern[1]);
    minutes = parseInt(twentyFourHourPattern[2]);
    // Assume 24-hour format if hours > 12
    if (hours > 12) {
      isPM = false; // Already in 24-hour format
    } else {
      // For 12 or less, we can't determine AM/PM, so we'll assume current time period
      const currentHour = baseDate.getHours();
      isPM = currentHour >= 12;
    }
  }
  
  // If no pattern matched, throw an error
  if (hours === 0 && minutes === 0 && !pmPattern1 && !amPattern1 && !pmPattern2 && !amPattern2 && !fullPattern && !fourDigitPattern && !fourDigitSpacePattern && !twentyFourHourPattern) {
    throw new Error(`Invalid time format: ${timeInput}. Supported formats: 12p, 12:30am, 1230 p, 12:00 PM, 12am, etc.`);
  }
  
  // Validate hours and minutes
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time: ${timeInput}. Hours must be 0-23, minutes must be 0-59.`);
  }
  
  // Validate 12-hour format hours (1-12)
  if ((pmPattern1 || amPattern1 || pmPattern2 || amPattern2 || fullPattern || fourDigitPattern || fourDigitSpacePattern) && (hours < 1 || hours > 12)) {
    throw new Error(`Invalid time: ${timeInput}. Hours must be 1-12 for 12-hour format.`);
  }
  
  // Convert 12-hour format to 24-hour format
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  // Set the time on the result date
  resultDate.setHours(hours, minutes, 0, 0);
  
  return resultDate;
}

/**
 * Format a Date object to 12-hour time format (12:00AM)
 */
export function formatTime12Hour(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${ampm}`;
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