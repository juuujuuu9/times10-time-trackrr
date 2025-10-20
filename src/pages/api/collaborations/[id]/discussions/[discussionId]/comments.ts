import type { APIRoute } from 'astro';
import { db } from '../../../../../../db';
import { taskDiscussions, teamMembers } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';
import { sendMentionNotificationEmail } from '../../../../../../utils/email';
import { extractMentions, resolveMentions } from '../../../../../../utils/mentionUtils';
import { getEmailBaseUrl } from '../../../../../../utils/url';
import { teamMembers, tasks, projects } from '../../../../../../db/schema';

// POST /api/collaborations/[id]/discussions/[discussionId]/comments - Create a new comment
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

    const body = await context.request.json().catch(() => ({}));
    const { content } = body;

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comment content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the discussion exists
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

    // Create the comment (as a reply to the discussion)
    const newComment = await db.insert(taskDiscussions).values({
      taskId: discussion.taskId,
      userId: currentUser.id,
      content: content.trim(),
      parentId: discussionId,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Get the created comment with user info
    const createdComment = await db.query.taskDiscussions.findFirst({
      where: eq(taskDiscussions.id, (newComment as any)[0].id),
      with: {
        user: true
      }
    });

    if (!createdComment) {
      throw new Error('Failed to retrieve created comment');
    }

    // Send email notifications for @ mentions in comments
    try {
      // Extract mentions from content and resolve them
      const extractedMentions = extractMentions(content);
      
      if (extractedMentions.length > 0) {
        // Get team members for mention resolution
        const teamMembersList = await db.query.teamMembers.findMany({
          where: eq(teamMembers.teamId, collaborationId),
          with: {
            user: true
          }
        });

        const teamMemberUsers = teamMembersList.map(tm => tm.user);
        const resolvedMentions = resolveMentions(extractedMentions, teamMemberUsers);
        
        // Get task details for email
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, discussion.taskId),
          with: {
            project: true
          }
        });

        if (task && resolvedMentions.length > 0) {
          // Get base URL for task stream link
          const baseUrl = getEmailBaseUrl();
          const taskStreamUrl = `${baseUrl}/admin/collaborations/${collaborationId}/task/${discussion.taskId}`;

          // Send email to each mentioned user
          for (const mention of resolvedMentions) {
            if (mention.email && mention.userId !== currentUser.id) {
              try {
                console.log(`📧 Sending mention email to ${mention.email} for user ${mention.fullName} (comment)`);
                await sendMentionNotificationEmail({
                  email: mention.email,
                  userName: mention.fullName,
                  mentionedBy: currentUser.name,
                  content: content,
                  taskName: task.name,
                  projectName: task.project.name,
                  taskStreamUrl: taskStreamUrl,
                  postType: 'comment'
                });
                console.log(`📧 Mention email sent to ${mention.email} (comment)`);
              } catch (emailError) {
                console.error(`Failed to send mention email to ${mention.email}:`, emailError);
              }
            }
          }
        }
      }
    } catch (emailNotificationError) {
      console.error('Error sending mention email notifications for comment:', emailNotificationError);
      // Don't fail the entire operation if email notifications fail
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: createdComment.id,
        content: createdComment.content,
        author: {
          id: createdComment.user.id,
          name: createdComment.user.name,
          email: createdComment.user.email,
          avatar: createdComment.user.avatar
        },
        createdAt: createdComment.createdAt.toISOString(),
        likes: createdComment.likes || 0
      },
      message: 'Comment created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create comment'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
