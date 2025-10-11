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

    // For now, return mock data since we don't have task notes linked to collaborations yet
    // TODO: Implement proper note system for collaborations
    const mockNotes = [
      {
        id: 1,
        title: "Project Kickoff Notes",
        content: "Outlined the QA checklist and assigned owners for each module. Please review before handoff.",
        author: {
          id: 1,
          name: "Priya Shah",
          email: "priya@example.com"
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isPrivate: false
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: mockNotes
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

    // For now, return success without actually creating the note
    // TODO: Implement proper note creation system for collaborations
    const newNote = {
      id: Date.now(), // Temporary ID
      title: title || 'Untitled Note',
      content: content.trim(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      },
      createdAt: new Date(),
      isPrivate: isPrivate
    };

    return new Response(JSON.stringify({
      success: true,
      data: newNote,
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
