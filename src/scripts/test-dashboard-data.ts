import { db } from '../db';
import { users, clients, projects, timeEntries } from '../db/schema';
import { eq, and, sql, gte, lte, isNull, isNotNull } from 'drizzle-orm';

// Test script to verify dashboard data and generate insights
async function testDashboardData() {
  try {
    console.log('🔍 Testing dashboard data and generating insights...');
    
    // Get all users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`👥 Found ${allUsers.length} active users`);
    
    // Get all projects and clients
    const allProjects = await db.select().from(projects).where(eq(projects.archived, false));
    const allClients = await db.select().from(clients).where(eq(clients.archived, false));
    console.log(`📋 Found ${allProjects.length} projects and ${allClients.length} clients`);
    
    // Get time entries with joins
    const timeEntriesWithDetails = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        projectId: timeEntries.projectId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPayRate: users.payRate,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(timeEntries.createdAt);
    
    console.log(`⏰ Found ${timeEntriesWithDetails.length} time entries`);
    
    // Analyze entry types
    const manualEntries = timeEntriesWithDetails.filter(e => e.durationManual);
    const timerEntries = timeEntriesWithDetails.filter(e => e.startTime && e.endTime);
    const ongoingTimers = timeEntriesWithDetails.filter(e => e.startTime && !e.endTime && !e.durationManual);
    
    console.log('\n📊 Entry Type Analysis:');
    console.log(`   - Manual duration entries: ${manualEntries.length} (${Math.round(manualEntries.length/timeEntriesWithDetails.length*100)}%)`);
    console.log(`   - Timer-based entries: ${timerEntries.length} (${Math.round(timerEntries.length/timeEntriesWithDetails.length*100)}%)`);
    console.log(`   - Ongoing timers: ${ongoingTimers.length} (${Math.round(ongoingTimers.length/timeEntriesWithDetails.length*100)}%)`);
    
    // Calculate total hours
    const totalHours = timeEntriesWithDetails.reduce((sum, entry) => {
      if (entry.durationManual) {
        return sum + (entry.durationManual / 3600);
      } else if (entry.startTime && entry.endTime) {
        return sum + ((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60));
      }
      return sum;
    }, 0);
    
    console.log(`\n⏱️ Total Hours Tracked: ${Math.round(totalHours)} hours`);
    
    // Calculate total cost (if pay rates are available)
    const totalCost = timeEntriesWithDetails.reduce((sum, entry) => {
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        if (entry.durationManual) {
          return sum + (entry.durationManual / 3600 * payRate);
        } else if (entry.startTime && entry.endTime) {
          const hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
          return sum + (hours * payRate);
        }
      }
      return sum;
    }, 0);
    
    console.log(`💰 Total Cost: $${Math.round(totalCost)}`);
    
    // Analyze by user
    console.log('\n👥 Per User Analysis:');
    const userStats = new Map();
    
    for (const entry of timeEntriesWithDetails) {
      if (!userStats.has(entry.userId)) {
        userStats.set(entry.userId, {
          name: entry.userName,
          email: entry.userEmail,
          payRate: entry.userPayRate,
          entries: 0,
          hours: 0,
          cost: 0,
          manualEntries: 0,
          timerEntries: 0
        });
      }
      
      const stats = userStats.get(entry.userId);
      stats.entries++;
      
      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
        stats.manualEntries++;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
        stats.timerEntries++;
      }
      
      stats.hours += hours;
      
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }
    }
    
    for (const [userId, stats] of userStats) {
      console.log(`   - ${stats.name}: ${stats.entries} entries, ${Math.round(stats.hours)} hours, $${Math.round(stats.cost)} cost`);
      console.log(`     Manual: ${stats.manualEntries}, Timer: ${stats.timerEntries}`);
    }
    
    // Analyze by project
    console.log('\n📋 Per Project Analysis:');
    const projectStats = new Map();
    
    for (const entry of timeEntriesWithDetails) {
      if (!projectStats.has(entry.projectId)) {
        projectStats.set(entry.projectId, {
          name: entry.projectName,
          client: entry.clientName,
          entries: 0,
          hours: 0,
          cost: 0
        });
      }
      
      const stats = projectStats.get(entry.projectId);
      stats.entries++;
      
      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      }
      
      stats.hours += hours;
      
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }
    }
    
    for (const [projectId, stats] of projectStats) {
      console.log(`   - ${stats.name} (${stats.client}): ${stats.entries} entries, ${Math.round(stats.hours)} hours, $${Math.round(stats.cost)} cost`);
    }
    
    // Analyze by client
    console.log('\n🏢 Per Client Analysis:');
    const clientStats = new Map();
    
    for (const entry of timeEntriesWithDetails) {
      if (!clientStats.has(entry.clientName)) {
        clientStats.set(entry.clientName, {
          entries: 0,
          hours: 0,
          cost: 0,
          projects: new Set()
        });
      }
      
      const stats = clientStats.get(entry.clientName);
      stats.entries++;
      stats.projects.add(entry.projectName);
      
      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      }
      
      stats.hours += hours;
      
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }
    }
    
    for (const [clientName, stats] of clientStats) {
      console.log(`   - ${clientName}: ${stats.entries} entries, ${Math.round(stats.hours)} hours, $${Math.round(stats.cost)} cost, ${stats.projects.size} projects`);
    }
    
    // Date range analysis
    const dates = timeEntriesWithDetails.map(e => new Date(e.createdAt).toDateString()).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    console.log(`\n📅 Date Range: ${firstDate} to ${lastDate}`);
    
    // Weekly analysis
    const weeklyStats = new Map();
    for (const entry of timeEntriesWithDetails) {
      const date = new Date(entry.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toDateString();
      
      if (!weeklyStats.has(weekKey)) {
        weeklyStats.set(weekKey, { entries: 0, hours: 0, cost: 0 });
      }
      
      const stats = weeklyStats.get(weekKey);
      stats.entries++;
      
      let hours = 0;
      if (entry.durationManual) {
        hours = entry.durationManual / 3600;
      } else if (entry.startTime && entry.endTime) {
        hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      }
      
      stats.hours += hours;
      
      if (entry.userPayRate) {
        const payRate = parseFloat(entry.userPayRate);
        stats.cost += hours * payRate;
      }
    }
    
    console.log('\n📊 Weekly Analysis:');
    for (const [week, stats] of weeklyStats) {
      console.log(`   - Week of ${week}: ${stats.entries} entries, ${Math.round(stats.hours)} hours, $${Math.round(stats.cost)} cost`);
    }
    
    console.log('\n✅ Dashboard data analysis completed successfully!');
    console.log('\n🎯 Key Insights:');
    console.log(`   - Total time entries: ${timeEntriesWithDetails.length}`);
    console.log(`   - Total hours: ${Math.round(totalHours)} hours`);
    console.log(`   - Total cost: $${Math.round(totalCost)}`);
    console.log(`   - Average hours per user: ${Math.round(totalHours / allUsers.length)} hours`);
    console.log(`   - Average cost per user: $${Math.round(totalCost / allUsers.length)}`);
    console.log(`   - Manual vs Timer ratio: ${Math.round(manualEntries.length/timeEntriesWithDetails.length*100)}% manual, ${Math.round(timerEntries.length/timeEntriesWithDetails.length*100)}% timer`);
    
  } catch (error) {
    console.error('❌ Error analyzing dashboard data:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  testDashboardData()
    .then(() => {
      console.log('\n✅ Analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { testDashboardData };
