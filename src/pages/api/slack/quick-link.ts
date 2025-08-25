import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackUsers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const slackUserId = searchParams.get('slackUserId');
    const workspaceId = searchParams.get('workspaceId');
    
    if (!userId || !slackUserId || !workspaceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: userId, slackUserId, workspaceId',
        example: '/api/slack/quick-link?userId=176&slackUserId=U1234567890&workspaceId=T13JYJDLH'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is already linked
    const existingLink = await db.query.slackUsers.findFirst({
      where: and(
        eq(slackUsers.userId, parseInt(userId)),
        eq(slackUsers.workspaceId, workspaceId)
      )
    });

    if (existingLink) {
      // Update existing link
      await db.update(slackUsers)
        .set({
          slackUserId,
          updatedAt: new Date()
        })
        .where(eq(slackUsers.id, existingLink.id));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'User link updated successfully',
        updated: true,
        userId: parseInt(userId),
        slackUserId,
        workspaceId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Create new link
      await db.insert(slackUsers).values({
        userId: parseInt(userId),
        slackUserId,
        workspaceId
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'User linked successfully',
        created: true,
        userId: parseInt(userId),
        slackUserId,
        workspaceId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Quick link error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
