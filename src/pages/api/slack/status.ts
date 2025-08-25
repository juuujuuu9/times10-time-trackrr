import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackWorkspaces, slackUsers } from '../../../db/schema';

export const GET: APIRoute = async () => {
  try {
    console.log('Slack status check requested');
    
    // Get workspace count
    const workspaces = await db.query.slackWorkspaces.findMany();
    console.log('Found workspaces:', workspaces.length);
    
    // Get linked users count
    const linkedUsers = await db.query.slackUsers.findMany();
    console.log('Found linked users:', linkedUsers.length);
    
    // Get workspace details
    const workspaceDetails = workspaces.map(ws => ({
      id: ws.workspaceId,
      name: ws.workspaceName,
      hasBotToken: !!ws.botAccessToken,
      createdAt: ws.createdAt
    }));
    
    // Get user details
    const userDetails = linkedUsers.map(su => ({
      userId: su.userId,
      slackUserId: su.slackUserId,
      workspaceId: su.workspaceId,
      hasEmail: !!su.slackEmail,
      createdAt: su.createdAt
    }));
    
    return new Response(JSON.stringify({
      status: 'healthy',
      workspaces: {
        count: workspaces.length,
        details: workspaceDetails
      },
      linkedUsers: {
        count: linkedUsers.length,
        details: userDetails
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Slack status check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
