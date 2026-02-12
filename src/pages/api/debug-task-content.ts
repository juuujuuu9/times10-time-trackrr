import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskNotes, taskDiscussions, taskLinks, taskFiles } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async (context) => {
  try {
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

    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'taskId parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get task details
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(taskId))
    });

    if (!task) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Task not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get task notes
    const notes = await db
      .select()
      .from(taskNotes)
      .where(eq(taskNotes.taskId, parseInt(taskId)))
      .orderBy(taskNotes.createdAt);

    // Get task discussions (insights)
    const discussions = await db
      .select()
      .from(taskDiscussions)
      .where(eq(taskDiscussions.taskId, parseInt(taskId)))
      .orderBy(taskDiscussions.createdAt);

    // Get task links
    const links = await db
      .select()
      .from(taskLinks)
      .where(eq(taskLinks.taskId, parseInt(taskId)))
      .orderBy(taskLinks.createdAt);

    // Get task files
    const files = await db
      .select()
      .from(taskFiles)
      .where(eq(taskFiles.taskId, parseInt(taskId)))
      .orderBy(taskFiles.createdAt);

    return new Response(JSON.stringify({
      success: true,
      data: {
        task: {
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        },
        content: {
          notes: notes.length,
          discussions: discussions.length,
          links: links.length,
          files: files.length
        },
        notes: notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          isPrivate: note.isPrivate,
          createdAt: note.createdAt
        })),
        discussions: discussions.map(discussion => ({
          id: discussion.id,
          content: discussion.content,
          type: discussion.type,
          createdAt: discussion.createdAt
        })),
        links: links.map(link => ({
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description,
          createdAt: link.createdAt
        })),
        files: files.map(file => ({
          id: file.id,
          filename: file.filename,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          createdAt: file.createdAt
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting task content:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get task content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};