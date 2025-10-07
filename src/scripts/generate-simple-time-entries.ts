import { db } from '../db';
import { users, clients, projects, timeEntries } from '../db/schema';
import { eq } from 'drizzle-orm';

// Simple time entry generation script
async function generateSimpleTimeEntries() {
  try {
    console.log('🚀 Starting simple time entry generation...');
    
    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`👥 Found ${allUsers.length} active users`);
    
    if (allUsers.length === 0) {
      console.log('❌ No active users found. Please create users first.');
      return;
    }
    
    // Get existing projects
    const projectsList = await db.select().from(projects).where(eq(projects.archived, false));
    console.log(`📋 Found ${projectsList.length} projects`);
    
    if (projectsList.length === 0) {
      console.log('❌ No projects found. Please create projects first.');
      return;
    }
    
    // Clear existing time entries
    console.log('🧹 Clearing existing time entries...');
    await db.delete(timeEntries);
    
    // Generate time entries from September 7, 2025 to today
    const startDate = new Date('2025-09-07');
    const endDate = new Date();
    
    console.log(`📅 Generating entries from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    const allTimeEntries = [];
    
    // Generate entries for each user
    for (const user of allUsers) {
      console.log(`👤 Generating entries for ${user.name}...`);
      
      // Generate entries for each business day
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        
        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Generate 1-3 entries per day
          const numEntries = Math.floor(Math.random() * 3) + 1;
          
          for (let i = 0; i < numEntries; i++) {
            const project = projectsList[Math.floor(Math.random() * projectsList.length)];
            const isManual = Math.random() < 0.3; // 30% manual entries
            
            // Generate work hours between 9am-5:30pm
            const startHour = 9 + Math.floor(Math.random() * 2); // 9-10am start
            const startMinute = Math.floor(Math.random() * 30);
            const workDuration = 2 + Math.random() * 3; // 2-5 hours per entry
            
            const startTime = new Date(currentDate);
            startTime.setHours(startHour, startMinute, 0, 0);
            
            const notes = [
              'Implemented user authentication system',
              'Fixed responsive design issues',
              'Optimized database queries',
              'Added unit tests',
              'Code review session',
              'Updated documentation',
              'Debugged production issues',
              'Implemented new features',
              'Refactored legacy code',
              'Set up CI/CD pipeline'
            ][Math.floor(Math.random() * 10)];
            
            if (isManual) {
              // Manual duration entry
              const durationSeconds = Math.floor(workDuration * 3600);
              allTimeEntries.push({
                userId: user.id,
                projectId: project.id,
                startTime: null,
                endTime: null,
                durationManual: durationSeconds,
                notes,
                createdAt: startTime,
                updatedAt: startTime
              });
            } else {
              // Timer-based entry
              const endTime = new Date(startTime);
              endTime.setHours(startTime.getHours() + workDuration);
              
              allTimeEntries.push({
                userId: user.id,
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
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Insert all time entries in batches
    console.log(`💾 Inserting ${allTimeEntries.length} time entries...`);
    
    const batchSize = 50;
    for (let i = 0; i < allTimeEntries.length; i += batchSize) {
      const batch = allTimeEntries.slice(i, i + batchSize);
      await db.insert(timeEntries).values(batch);
      
      if (i % 200 === 0) {
        console.log(`   Inserted ${i + batch.length} entries...`);
      }
    }
    
    // Calculate statistics
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
  generateSimpleTimeEntries()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { generateSimpleTimeEntries };
