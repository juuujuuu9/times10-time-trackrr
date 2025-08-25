import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { taskAssignments, users, slackUsers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserBySlackId } from '../../../utils/slack';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('Test user data endpoint hit');
    
    const searchParams = url.searchParams;
    const slackUserId = searchParams.get('slackUserId');
    const workspaceId = searchParams.get('workspaceId');
    
    if (!slackUserId || !workspaceId) {
      return new Response(JSON.stringify({
        error: 'Missing slackUserId or workspaceId parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Testing user data for:', slackUserId, 'in workspace:', workspaceId);
    
    let results = {
      userFound: false,
      userData: null as any,
      taskAssignments: 0,
      errors: [] as string[]
    };

    // Test user lookup
    try {
      const user = await getUserBySlackId(slackUserId, workspaceId);
      results.userFound = !!user;
      results.userData = user ? {
        id: user.id,
        name: user.name,
        email: user.email
      } : null;
      console.log('User lookup result:', user ? 'Found' : 'Not found');
    } catch (error) {
      results.errors.push(`User lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('User lookup failed:', error);
    }

    // Test task assignments
    if (results.userFound && results.userData) {
      try {
        const assignments = await db.query.taskAssignments.findMany({
          where: eq(taskAssignments.userId, results.userData.id)
        });
        results.taskAssignments = assignments.length;
        console.log('Task assignments found:', assignments.length);
      } catch (error) {
        results.errors.push(`Task assignments lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Task assignments lookup failed:', error);
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test user data error:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
