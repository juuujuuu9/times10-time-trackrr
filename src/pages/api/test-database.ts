import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { teams, teamMembers } from '../../db/schema';
import { count } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Test database connection and collaborative tables
    const teamsCount = await db.select({ count: count() }).from(teams);
    const membersCount = await db.select({ count: count() }).from(teamMembers);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful',
      data: {
        teamsCount: teamsCount[0].count,
        membersCount: membersCount[0].count,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
