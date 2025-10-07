import { db } from '../db';
import { users, clients, projects, timeEntries } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Realistic project names and descriptions
const PROJECT_TYPES = [
  { name: 'Frontend Development', description: 'React components and UI implementation' },
  { name: 'Backend API', description: 'RESTful API development and database integration' },
  { name: 'Database Optimization', description: 'Query optimization and schema improvements' },
  { name: 'Testing & QA', description: 'Unit tests, integration tests, and quality assurance' },
  { name: 'Code Review', description: 'Peer code review and technical discussions' },
  { name: 'Documentation', description: 'Technical documentation and API docs' },
  { name: 'Bug Fixes', description: 'Debugging and bug resolution' },
  { name: 'Feature Development', description: 'New feature implementation' },
  { name: 'Performance Optimization', description: 'Application performance improvements' },
  { name: 'Security Audit', description: 'Security review and vulnerability assessment' }
];

// Realistic client names
const CLIENT_NAMES = [
  'Acme Corporation',
  'TechStart Inc',
  'Global Solutions',
  'Innovation Labs',
  'Digital Dynamics',
  'CloudTech Solutions',
  'DataFlow Systems',
  'NextGen Technologies',
  'SmartBridge Consulting',
  'FutureWorks Inc'
];

// Realistic notes for time entries
const TIME_ENTRY_NOTES = [
  'Implemented user authentication system',
  'Fixed responsive design issues on mobile',
  'Optimized database queries for better performance',
  'Added unit tests for new features',
  'Reviewed and merged pull requests',
  'Updated API documentation',
  'Debugged production issues',
  'Implemented new dashboard widgets',
  'Refactored legacy code',
  'Set up CI/CD pipeline',
  'Conducted code review session',
  'Updated project dependencies',
  'Created technical specifications',
  'Fixed cross-browser compatibility issues',
  'Optimized image loading performance',
  'Implemented error handling',
  'Added logging and monitoring',
  'Updated user interface components',
  'Fixed data validation issues',
  'Conducted team standup meeting'
];

// Generate realistic work hours between 9am-5:30pm
function generateWorkHours(): { startHour: number; endHour: number; duration: number } {
  const startHour = 9 + Math.floor(Math.random() * 2); // 9am-10am start
  const workDuration = 4 + Math.floor(Math.random() * 4); // 4-7 hours of work
  const breakDuration = Math.floor(Math.random() * 2) + 1; // 1-2 hour break
  const endHour = startHour + workDuration + breakDuration;
  
  // Ensure we don't go past 5:30pm (17.5)
  if (endHour > 17.5) {
    return { startHour: 9, endHour: 17, duration: 7 };
  }
  
  return { startHour, endHour, duration: workDuration };
}

// Generate realistic time entry
function generateTimeEntry(
  userId: number, 
  projectId: number, 
  date: Date, 
  isManual: boolean = false
): any {
  const { startHour, endHour, duration } = generateWorkHours();
  
  // Add some randomness to start time (within 30 minutes)
  const startMinute = Math.floor(Math.random() * 30);
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  const notes = TIME_ENTRY_NOTES[Math.floor(Math.random() * TIME_ENTRY_NOTES.length)];
  
  if (isManual) {
    // Manual duration entry (in seconds)
    const durationSeconds = duration * 3600; // Convert hours to seconds
    
    return {
      userId,
      projectId,
      startTime: null,
      endTime: null,
      durationManual: durationSeconds,
      notes,
      createdAt: startTime,
      updatedAt: startTime
    };
  } else {
    // Timer-based entry
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + duration);
    
    return {
      userId,
      projectId,
      startTime,
      endTime,
      durationManual: null,
      notes,
      createdAt: startTime,
      updatedAt: endTime
    };
  }
}

// Get all business days between two dates
function getBusinessDays(startDate: Date, endDate: Date): Date[] {
  const businessDays: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

// Generate time entries for a user for a specific week
function generateWeeklyTimeEntries(
  userId: number, 
  projects: any[], 
  weekStart: Date
): any[] {
  const entries: any[] = [];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const businessDays = getBusinessDays(weekStart, weekEnd);
  
  // Ensure minimum 25 hours per week (5 hours per business day)
  const minHoursPerDay = 5;
  const maxHoursPerDay = 8;
  
  for (const day of businessDays) {
    const numEntries = Math.floor(Math.random() * 3) + 1; // 1-3 entries per day
    const totalHoursForDay = minHoursPerDay + Math.random() * (maxHoursPerDay - minHoursPerDay);
    const hoursPerEntry = totalHoursForDay / numEntries;
    
    for (let i = 0; i < numEntries; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const isManual = Math.random() < 0.3; // 30% manual entries
      
      // Create entry with specific duration
      const startHour = 9 + Math.floor(Math.random() * 2);
      const startMinute = Math.floor(Math.random() * 30);
      const startTime = new Date(day);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const notes = TIME_ENTRY_NOTES[Math.floor(Math.random() * TIME_ENTRY_NOTES.length)];
      
      if (isManual) {
        const durationSeconds = Math.floor(hoursPerEntry * 3600);
        entries.push({
          userId,
          projectId: project.id,
          startTime: null,
          endTime: null,
          durationManual: durationSeconds,
          notes,
          createdAt: startTime,
          updatedAt: startTime
        });
      } else {
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + hoursPerEntry);
        
        entries.push({
          userId,
          projectId: project.id,
          startTime,
          endTime,
          durationManual: null,
          notes,
          createdAt: startTime,
          updatedAt: endTime
        });
      }
    }
  }
  
  return entries;
}

async function generateRealisticTimeEntries() {
  try {
    console.log('🚀 Starting realistic time entry generation...');
    console.log('📅 Generating data from September 7, 2025 to today');
    
    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`👥 Found ${allUsers.length} active users`);
    
    if (allUsers.length === 0) {
      console.log('❌ No active users found. Please create users first.');
      return;
    }
    
    // Get or create clients
    let clientsList = await db.select().from(clients).where(eq(clients.archived, false));
    
    if (clientsList.length === 0) {
      console.log('🏢 Creating clients...');
      const adminUser = allUsers.find(u => u.role === 'admin') || allUsers[0];
      
      for (const clientName of CLIENT_NAMES.slice(0, 5)) {
        const [newClient] = await db.insert(clients).values({
          name: clientName,
          createdBy: adminUser.id
        }).returning();
        clientsList.push(newClient);
      }
    }
    
    // Get or create projects
    let projectsList = await db.select().from(projects).where(eq(projects.archived, false));
    
    if (projectsList.length === 0) {
      console.log('📋 Creating projects...');
      
      for (const client of clientsList) {
        // Create 2-3 projects per client
        const numProjects = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < numProjects; i++) {
          const projectType = PROJECT_TYPES[Math.floor(Math.random() * PROJECT_TYPES.length)];
          const [newProject] = await db.insert(projects).values({
            name: `${projectType.name} - ${client.name}`,
            clientId: client.id
          }).returning();
          projectsList.push(newProject);
        }
      }
    }
    
    console.log(`📊 Found ${clientsList.length} clients and ${projectsList.length} projects`);
    
    // Clear existing time entries (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing time entries...');
    await db.delete(timeEntries);
    
    // Generate time entries from September 7, 2025 to today
    const startDate = new Date('2025-09-07');
    const endDate = new Date();
    
    console.log(`📅 Generating entries from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    const allTimeEntries: any[] = [];
    const businessDays = getBusinessDays(startDate, endDate);
    
    console.log(`📊 Found ${businessDays.length} business days to generate entries for`);
    
    // Generate entries for each user
    for (const user of allUsers) {
      console.log(`👤 Generating entries for ${user.name}...`);
      
      // Generate entries week by week
      const currentWeekStart = new Date(startDate);
      
      while (currentWeekStart <= endDate) {
        const weekEntries = generateWeeklyTimeEntries(user, projectsList, new Date(currentWeekStart));
        allTimeEntries.push(...weekEntries);
        
        // Move to next week
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
    }
    
    // Insert all time entries in batches
    console.log(`💾 Inserting ${allTimeEntries.length} time entries...`);
    
    const batchSize = 100;
    for (let i = 0; i < allTimeEntries.length; i += batchSize) {
      const batch = allTimeEntries.slice(i, i + batchSize);
      await db.insert(timeEntries).values(batch);
      
      if (i % 1000 === 0) {
        console.log(`   Inserted ${i + batch.length} entries...`);
      }
    }
    
    // Calculate and display statistics
    const totalHours = allTimeEntries.reduce((sum, entry) => {
      if (entry.durationManual) {
        return sum + (entry.durationManual / 3600);
      } else if (entry.startTime && entry.endTime) {
        return sum + ((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60));
      }
      return sum;
    }, 0);
    
    const manualEntries = allTimeEntries.filter(e => e.durationManual).length;
    const timerEntries = allTimeEntries.filter(e => e.startTime && e.endTime).length;
    
    console.log('\n🎉 Time entry generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Generated ${allTimeEntries.length} total time entries`);
    console.log(`   - ${manualEntries} manual duration entries (${Math.round(manualEntries/allTimeEntries.length*100)}%)`);
    console.log(`   - ${timerEntries} timer-based entries (${Math.round(timerEntries/allTimeEntries.length*100)}%)`);
    console.log(`   - Total hours tracked: ${Math.round(totalHours)} hours`);
    console.log(`   - Average hours per user: ${Math.round(totalHours / allUsers.length)} hours`);
    console.log(`   - Time period: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    console.log('\n👥 Per User Breakdown:');
    for (const user of allUsers) {
      const userEntries = allTimeEntries.filter(e => e.userId === user.id);
      const userHours = userEntries.reduce((sum, entry) => {
        if (entry.durationManual) {
          return sum + (entry.durationManual / 3600);
        } else if (entry.startTime && entry.endTime) {
          return sum + ((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60));
        }
        return sum;
      }, 0);
      
      console.log(`   - ${user.name}: ${userEntries.length} entries, ${Math.round(userHours)} hours`);
    }
    
  } catch (error) {
    console.error('❌ Error generating time entries:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRealisticTimeEntries()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { generateRealisticTimeEntries };
