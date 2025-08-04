import 'dotenv/config';
import { db } from '../db/index';
import { timeEntries, tasks, users, taskAssignments } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// Helper function to check if a date is a weekday (Monday-Friday)
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

// Helper function to get the previous weekday
function getPreviousWeekday(date: Date): Date {
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  
  // If it's Sunday, go back to Friday
  if (prevDate.getDay() === 0) {
    prevDate.setDate(prevDate.getDate() - 2);
  }
  // If it's Saturday, go back to Friday
  else if (prevDate.getDay() === 6) {
    prevDate.setDate(prevDate.getDate() - 1);
  }
  
  return prevDate;
}

// Generate realistic work patterns
function generateWorkPattern(): {
  startHour: number;
  endHour: number;
  breakDuration: number;
  lunchDuration: number;
} {
  const patterns = [
    // Early bird pattern
    { startHour: 7, endHour: 16, breakDuration: 15, lunchDuration: 45 },
    // Standard 9-5
    { startHour: 9, endHour: 17, breakDuration: 15, lunchDuration: 60 },
    // Late start pattern
    { startHour: 10, endHour: 18, breakDuration: 20, lunchDuration: 45 },
    // Long day pattern
    { startHour: 8, endHour: 19, breakDuration: 30, lunchDuration: 60 },
    // Flexible pattern
    { startHour: 8, endHour: 17, breakDuration: 10, lunchDuration: 30 }
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate realistic time entries for a single day
function generateDayTimeEntries(
  date: Date,
  userId: number,
  taskIds: number[],
  workPattern: any
): any[] {
  const entries: any[] = [];
  const { startHour, endHour, breakDuration, lunchDuration } = workPattern;
  

  
  // Calculate total work hours
  const totalWorkHours = endHour - startHour;
  const totalBreakMinutes = breakDuration + lunchDuration;
  const actualWorkHours = totalWorkHours - (totalBreakMinutes / 60);
  
  // Split work into 2-4 sessions
  const numSessions = Math.floor(Math.random() * 3) + 2; // 2-4 sessions
  const sessionDuration = actualWorkHours / numSessions;
  
  let currentHour = startHour;
  
  for (let session = 0; session < numSessions; session++) {
    // Add some variation to session duration (±30 minutes)
    const variation = (Math.random() - 0.5) * 1; // ±0.5 hours
    const actualSessionDuration = Math.max(0.5, sessionDuration + variation);
    
    const startTime = new Date(date);
    startTime.setHours(Math.floor(currentHour), (currentHour % 1) * 60, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + Math.floor(actualSessionDuration * 60));
    

    
    // Pick a random task
    const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
    
    // Generate realistic notes
    const notes = generateSessionNotes(session, actualSessionDuration);
    
    entries.push({
      taskId,
      userId,
      startTime,
      endTime,
      durationManual: Math.floor(actualSessionDuration * 3600), // Convert to seconds
      notes
    });
    
    // Move to next session time
    currentHour += actualSessionDuration;
    
    // Add break between sessions (except after last session)
    if (session < numSessions - 1) {
      const breakTime = session === 1 ? lunchDuration / 60 : breakDuration / 60; // Lunch after second session
      currentHour += breakTime;
    }
  }
  
  return entries;
}

// Generate realistic notes for work sessions
function generateSessionNotes(sessionIndex: number, duration: number): string {
  const morningTasks = [
    'Morning planning and task prioritization',
    'Client communication and email management',
    'Project research and requirements analysis',
    'Design concept development',
    'Code review and debugging',
    'Team standup and collaboration',
    'Creative brainstorming session',
    'Documentation and project setup'
  ];
  
  const afternoonTasks = [
    'Design implementation and refinement',
    'Client feedback integration',
    'Quality assurance and testing',
    'Final production work',
    'Project documentation',
    'Team collaboration and reviews',
    'Creative asset development',
    'Performance optimization'
  ];
  
  const longSessionTasks = [
    'Deep focus work on complex features',
    'Extended design iteration session',
    'Comprehensive code refactoring',
    'Detailed project planning and strategy',
    'Intensive problem-solving session',
    'Creative direction and concept development'
  ];
  
  const tasks = duration > 3 ? longSessionTasks : 
                sessionIndex < 2 ? morningTasks : afternoonTasks;
  
  return tasks[Math.floor(Math.random() * tasks.length)];
}

// Generate extended time entries spanning past 30 weekdays
async function generateExtendedTimeEntries() {
  console.log('⏱️  Generating extended time entries for past 30 weekdays...');
  
  try {
    // Get all active users
    const activeUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${activeUsers.length} active users`);
    
    // Get all tasks
    const allTasks = await db.select().from(tasks).where(eq(tasks.archived, false));
    console.log(`Found ${allTasks.length} active tasks`);
    
    // Get task assignments to know which users work on which tasks
    const assignments = await db.select().from(taskAssignments);
    const userTaskMap = new Map<number, number[]>();
    
    assignments.forEach(assignment => {
      if (!userTaskMap.has(assignment.userId)) {
        userTaskMap.set(assignment.userId, []);
      }
      userTaskMap.get(assignment.userId)!.push(assignment.taskId);
    });
    
    // Generate time entries for each user
    const allTimeEntries: any[] = [];
    const now = new Date();
    
    activeUsers.forEach(user => {
      // Get tasks assigned to this user, or use all tasks if none assigned
      const userTasks = userTaskMap.get(user.id) || allTasks.map(t => t.id);
      
      // Generate work pattern for this user
      const workPattern = generateWorkPattern();
      
      // Generate entries for past 30 weekdays
      let currentDate = new Date(now);
      let weekdayCount = 0;
      
      while (weekdayCount < 30) {
        currentDate = getPreviousWeekday(currentDate);
        
        // Skip if we've gone too far back (safety check)
        if (currentDate < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) { // 60 days ago
          break;
        }
        
        // Generate entries for every weekday (no randomness)
        const dayEntries = generateDayTimeEntries(new Date(currentDate), user.id, userTasks, workPattern);
        allTimeEntries.push(...dayEntries);
        
        weekdayCount++;
      }
    });
    
    // Insert all time entries
    if (allTimeEntries.length > 0) {
      await db.insert(timeEntries).values(allTimeEntries);
      console.log(`✅ Generated ${allTimeEntries.length} time entries spanning past 30 weekdays`);
    }
    
    // Generate some ongoing entries for today
    const ongoingEntries = 8;
    const today = new Date();
    
    if (isWeekday(today)) {
      for (let i = 0; i < ongoingEntries; i++) {
        const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];
        const userTasks = userTaskMap.get(user.id) || allTasks.map(t => t.id);
        const taskId = userTasks[Math.floor(Math.random() * userTasks.length)];
        
        const workPattern = generateWorkPattern();
        const startHour = workPattern.startHour + Math.floor(Math.random() * 4); // Start within 4 hours of work pattern
        const startTime = new Date(today);
        startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
        
        // For ongoing entries, set a partial duration (1-4 hours)
        const ongoingDurationHours = Math.floor(Math.random() * 4) + 1;
        const ongoingDurationSeconds = ongoingDurationHours * 3600;
        
        allTimeEntries.push({
          taskId,
          userId: user.id,
          startTime,
          endTime: null, // Ongoing entry
          durationManual: ongoingDurationSeconds,
          notes: 'Currently working on this task'
        });
      }
    }
    
    // Calculate date range
    const earliestDate = new Date(Math.min(...allTimeEntries.map(e => new Date(e.startTime).getTime())));
    const latestDate = new Date(Math.max(...allTimeEntries.map(e => new Date(e.startTime).getTime())));
    
    console.log(`📊 Summary:`);
    console.log(`   - Generated time entries for ${activeUsers.length} users`);
    console.log(`   - Date range: ${earliestDate.toDateString()} to ${latestDate.toDateString()}`);
    console.log(`   - Spanned past 30 weekdays (every single weekday)`);
    console.log(`   - Created ${allTimeEntries.length} total time entries`);
    console.log(`   - Added ${ongoingEntries} ongoing entries for today`);
    
    return allTimeEntries;
    
  } catch (error) {
    console.error('❌ Error generating extended time entries:', error);
    throw error;
  }
}

// Function to clear existing time entries (optional)
async function clearExistingTimeEntries() {
  console.log('🗑️  Clearing existing time entries...');
  await db.delete(timeEntries);
  console.log('✅ Existing time entries cleared');
}

// Main function
async function generateExtendedTimeData(clearExisting: boolean = false) {
  try {
    console.log('🚀 Starting extended time data generation...');
    
    if (clearExisting) {
      await clearExistingTimeEntries();
    }
    
    const entries = await generateExtendedTimeEntries();
    
    console.log('🎉 Extended time data generation completed successfully!');
    return entries;
    
  } catch (error) {
    console.error('❌ Error generating extended time data:', error);
    throw error;
  }
}

// Export the function for use in other files
export { generateExtendedTimeData, generateExtendedTimeEntries }; 