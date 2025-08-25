import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackWorkspaces, slackUsers } from '../../../db/schema';

export const GET: APIRoute = async () => {
  try {
    console.log('Slack status check requested');
    
    // Get all workspaces
    const workspaces = await db.query.slackWorkspaces.findMany();
    console.log('Found workspaces:', workspaces.length);
    
    // Get all linked users
    const linkedUsers = await db.query.slackUsers.findMany({
      with: {
        user: true
      }
    });
    console.log('Found linked users:', linkedUsers.length);
    
    return new Response(JSON.stringify({
      status: 'healthy',
      workspaces: workspaces.map(w => ({
        id: w.workspaceId,
        name: w.workspaceName,
        createdAt: w.createdAt
      })),
      linkedUsers: linkedUsers.map(u => ({
        slackUserId: u.slackUserId,
        workspaceId: u.workspaceId,
        userName: u.user?.name || 'Unknown'
      })),
      summary: {
        totalWorkspaces: workspaces.length,
        totalLinkedUsers: linkedUsers.length
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Slack status check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
