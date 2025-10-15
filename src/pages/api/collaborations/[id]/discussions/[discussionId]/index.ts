import type { APIRoute } from 'astro';
import { db } from '../../../../../../db';
import { taskDiscussions, teamMembers } from '../../../../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';

// DELETE /api/collaborations/[id]/discussions/[discussionId] - Soft delete a discussion (author or admin/dev)
export const DELETE: APIRoute = async (context) => {
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

    // Ensure user is a member of the collaboration (team)
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

    // Load the discussion and verify ownership or elevated role
    const discussion = await db.query.taskDiscussions.findFirst({
      where: eq(taskDiscussions.id, discussionId)
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

    // NOTE: We only enforce membership to the collaboration (team) above.
    // Some tasks may not have a teamId or associations can be indirect.
    // To keep things simple (RULE-001), we don't hard-enforce a teamId match here.

    const isAuthor = discussion.userId === currentUser.id;
    const isElevated = currentUser.role === 'admin' || currentUser.role === 'developer';
    if (!isAuthor && !isElevated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the author or an admin can delete this discussion'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete: set archived=true
    await db
      .update(taskDiscussions)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(taskDiscussions.id, discussionId));

    return new Response(JSON.stringify({
      success: true,
      message: 'Discussion deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting discussion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete discussion'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


