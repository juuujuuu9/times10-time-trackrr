import type { APIRoute } from 'astro';
import { db } from '../../../../../../db';
import { taskDiscussions, teamMembers, tasks } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';
import { sendInsightLikedEmail } from '../../../../../../utils/email';
import { getEmailBaseUrl } from '../../../../../../utils/url';

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

    // Get the discussion with author info
    const discussion = await db.query.taskDiscussions.findFirst({
      where: eq(taskDiscussions.id, discussionId),
      with: {
        user: true
      }
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

    // Send like notification to the insight author (if not the same user)
    if (discussion.user && discussion.user.email && discussion.user.id !== currentUser.id) {
      try {
        // Get task details for notification
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, discussion.taskId),
          with: {
            project: true
          }
        });

        if (task) {
          const baseUrl = getEmailBaseUrl();
          const taskStreamUrl = `${baseUrl}/admin/collaborations/${collaborationId}/task/${discussion.taskId}`;

          console.log(`📧 Attempting to send insight liked email to ${discussion.user.email}`);
          await sendInsightLikedEmail({
            email: discussion.user.email,
            userName: discussion.user.name,
            taskName: task.name,
            projectName: task.project?.name || 'Unknown Project',
            likedBy: currentUser.name,
            insightContent: discussion.content,
            taskStreamUrl: taskStreamUrl,
          });
          console.log(`📧 Insight liked email sent to ${discussion.user.email}`);
        }
      } catch (likeNotificationError) {
        console.error('Error sending insight liked notification:', likeNotificationError);
        // Don't fail the entire operation if like notification fails
      }
    }

    // For now, just return success since likes field doesn't exist in schema
    // TODO: Implement proper like system with user tracking
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: discussion.id,
        likes: 0
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
