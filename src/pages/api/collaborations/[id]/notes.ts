import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { taskNotes, teams, teamMembers, users } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/notes - Get notes for a collaboration
export const GET: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
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

    // Get collaboration details
    const collaboration = await db.query.teams.findFirst({
      where: eq(teams.id, collaborationId)
    });

    if (!collaboration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Collaboration not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get notes for this collaboration
    // For now, we'll create a simple note system using the taskNotes table
    // In the future, we should create a dedicated collaboration_notes table
    const notes = await db.query.taskNotes.findMany({
      where: eq(taskNotes.taskId, collaborationId), // Using taskId as collaborationId for now
      with: {
        author: true
      },
      orderBy: [desc(taskNotes.createdAt)]
    });

    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title || 'Untitled Note',
      content: note.content,
      author: {
        id: note.author.id,
        name: note.author.name,
        email: note.author.email
      },
      createdAt: note.createdAt,
      isPrivate: note.isPrivate || false
    }));

    return new Response(JSON.stringify({
      success: true,
      data: formattedNotes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaboration notes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch notes'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/collaborations/[id]/notes - Create a new note
export const POST: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
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
    const { title, content, isPrivate = false } = body;

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Note content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the note in the database
    const newNote = await db.insert(taskNotes).values({
      taskId: collaborationId, // Using taskId as collaborationId for now
      authorId: currentUser.id,
      title: title || 'Untitled Note',
      content: content.trim(),
      isPrivate: isPrivate,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const createdNote = newNote[0];

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: createdNote.id,
        title: createdNote.title,
        content: createdNote.content,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email
        },
        createdAt: createdNote.createdAt,
        isPrivate: createdNote.isPrivate
      },
      message: 'Note created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating note:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create note'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
