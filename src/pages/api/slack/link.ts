import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackUsers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const slackUserId = formData.get('slackUserId') as string;
    const workspaceId = formData.get('workspaceId') as string;
    
    if (!userId || !slackUserId || !workspaceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: userId, slackUserId, workspaceId'
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
        updated: true
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
        created: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Link user error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
