import type { APIRoute } from 'astro';
import { db } from '../../../../../../db';
import { taskDiscussions, teamMembers } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';

// POST /api/collaborations/[id]/discussions/[discussionId]/like - Like/unlike a discussion
export const POST: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    const discussionId = parseInt(context.params.discussionId!);
    
    if (!collaborationId || isNaN(collaborationId) || !discussionId || isNaN(discussionId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration or discussion ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is member of the collaboration
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, collaborationId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!membership && currentUser.role !== 'admin' && currentUser.role !== 'developer') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the discussion
    const discussion = await db.query.taskDiscussions.findFirst({
      where: and(
        eq(taskDiscussions.id, discussionId),
        eq(taskDiscussions.teamId, collaborationId)
      )
    });

    if (!discussion) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discussion not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, just increment the likes count
    // TODO: Implement proper like system with user tracking
    const updatedDiscussion = await db.update(taskDiscussions)
      .set({
        likes: (discussion.likes || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(taskDiscussions.id, discussionId))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedDiscussion[0].id,
        likes: updatedDiscussion[0].likes
      },
      message: 'Discussion liked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error liking discussion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to like discussion'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
