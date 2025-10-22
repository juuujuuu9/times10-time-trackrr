import type { APIRoute } from 'astro';
import { db } from '../../../../../../db';
import { taskDiscussions, teamMembers, taskFiles } from '../../../../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { getSessionUser } from '../../../../../../utils/session';
import { promises as fs } from 'fs';
import path from 'path';

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

    // If this is a media post, delete associated files
    if (discussion.type === 'media') {
      console.log('🗑️ Deleting media files for discussion:', discussionId);
      
      // Get file records associated with this discussion
      const fileRecords = await db.query.taskFiles.findMany({
        where: eq(taskFiles.taskId, discussion.taskId)
      });
      
      // Delete files from filesystem
      for (const fileRecord of fileRecords) {
        try {
          const filePath = path.join('./public', fileRecord.filePath);
          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log('✅ Deleted file:', filePath);
          } catch (accessError) {
            console.log('⚠️ File not found:', filePath);
          }
        } catch (fileError) {
          console.error('❌ Error deleting file:', fileRecord.filePath, fileError);
          // Continue with other files even if one fails
        }
      }
      
      // Delete file records from database
      if (fileRecords.length > 0) {
        await db.delete(taskFiles).where(eq(taskFiles.taskId, discussion.taskId));
        console.log('✅ Deleted', fileRecords.length, 'file records from database');
      }
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

// PUT /api/collaborations/[id]/discussions/[discussionId] - Update a discussion (author only)
export const PUT: APIRoute = async (context) => {
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

    // Load the discussion and verify ownership
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

    const body = await context.request.json().catch(() => ({}));
    const { content, subtaskData } = body;

    // Handle subtask completion updates - allow any team member to update subtasks
    if (subtaskData) {
      // Update subtask data in the discussion
      await db
        .update(taskDiscussions)
        .set({ 
          subtaskData: JSON.stringify(subtaskData),
          updatedAt: new Date() 
        })
        .where(eq(taskDiscussions.id, discussionId));

      return new Response(JSON.stringify({
        success: true,
        message: 'Subtask completion updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only the author can edit the discussion content (not subtasks)
    if (discussion.userId !== currentUser.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the author can edit this discussion'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the discussion content
    await db
      .update(taskDiscussions)
      .set({ 
        content: content.trim(), 
        updatedAt: new Date() 
      })
      .where(eq(taskDiscussions.id, discussionId));

    return new Response(JSON.stringify({
      success: true,
      message: 'Discussion updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating discussion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update discussion'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


