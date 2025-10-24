import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users, projects, clients, timeEntries } from '../../db/schema';
import { count } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('=== DETAILED DATABASE DEBUG ===');
    
    // Get database connection info
    const dbInfo = await db.execute(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        NOW() as current_time,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);
    
    // Get actual data counts to verify which database we're connected to
    const usersCount = await db.select({ count: count() }).from(users);
    const projectsCount = await db.select({ count: count() }).from(projects);
    const clientsCount = await db.select({ count: count() }).from(clients);
    const timeEntriesCount = await db.select({ count: count() }).from(timeEntries);
    
    // Get some sample data to identify which database this is
    const sampleUsers = await db.query.users.findMany({ limit: 3 });
    const sampleProjects = await db.query.projects.findMany({ limit: 3 });
    
    console.log('Database Info:', dbInfo.rows[0]);
    console.log('Users count:', usersCount[0].count);
    console.log('Projects count:', projectsCount[0].count);
    console.log('Sample users:', sampleUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Detailed database debug info',
      database_info: dbInfo.rows[0],
      data_counts: {
        users: usersCount[0].count,
        projects: projectsCount[0].count,
        clients: clientsCount[0].count,
        time_entries: timeEntriesCount[0].count
      },
      sample_data: {
        users: sampleUsers.map(u => ({ id: u.id, email: u.email, name: u.name })),
        projects: sampleProjects.map(p => ({ id: p.id, name: p.name, clientId: p.clientId }))
      },
      environment: {
        DATABASE_URL: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database debug error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
