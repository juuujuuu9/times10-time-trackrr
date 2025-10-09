import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { timeEntries, users, projects, clients } from '../../db/schema';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Debug: Checking database connection...');
    
    // Check if time_entries table exists and has data
    const timeEntriesCount = await db.select({ count: sql`count(*)` }).from(timeEntries);
    console.log('📊 Time entries count:', timeEntriesCount[0]?.count || 0);
    
    // Check users count
    const usersCount = await db.select({ count: sql`count(*)` }).from(users);
    console.log('👥 Users count:', usersCount[0]?.count || 0);
    
    // Check projects count
    const projectsCount = await db.select({ count: sql`count(*)` }).from(projects);
    console.log('📁 Projects count:', projectsCount[0]?.count || 0);
    
    // Check clients count
    const clientsCount = await db.select({ count: sql`count(*)` }).from(clients);
    console.log('🏢 Clients count:', clientsCount[0]?.count || 0);
    
    // Get all time entries with basic info
    const allTimeEntries = await db
      .select({
        id: timeEntries.id,
        userId: timeEntries.userId,
        projectId: timeEntries.projectId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        createdAt: timeEntries.createdAt,
        notes: timeEntries.notes
      })
      .from(timeEntries)
      .limit(10);
    
    console.log('📝 Sample time entries:', allTimeEntries);
    
    // Try the same query as the admin page
    console.log('🔍 Testing admin page query...');
    const adminQuery = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        userName: users.name,
        projectName: projects.name,
        clientName: clients.name,
        duration: sql`CASE 
          WHEN ${timeEntries.durationManual} IS NOT NULL 
          THEN ${timeEntries.durationManual}
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE 0
        END`.as('duration')
      })
      .from(timeEntries)
      .innerJoin(users, sql`${timeEntries.userId} = ${users.id}`)
      .innerJoin(projects, sql`${timeEntries.projectId} = ${projects.id}`)
      .innerJoin(clients, sql`${projects.clientId} = ${clients.id}`)
      .orderBy(sql`${timeEntries.createdAt} DESC`)
      .limit(5);
    
    console.log('📋 Admin query results:', adminQuery);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        timeEntriesCount: timeEntriesCount[0]?.count || 0,
        usersCount: usersCount[0]?.count || 0,
        projectsCount: projectsCount[0]?.count || 0,
        clientsCount: clientsCount[0]?.count || 0,
        sampleTimeEntries: allTimeEntries,
        adminQueryResults: adminQuery
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
