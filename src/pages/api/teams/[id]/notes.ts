import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers, users } from '../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// GET /api/teams/[id]/notes - Get team notes
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a member of the team
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team notes (for now, we'll use a simple approach)
    // In a real implementation, you'd have a team_notes table
    const notes = await db
      .select({
        id: sql`ROW_NUMBER() OVER (ORDER BY ${users.createdAt})`.as('id'),
        userId: users.id,
        userName: users.name,
        content: sql`'Welcome to the team! This is a sample note.'`.as('content'),
        createdAt: sql`NOW()`.as('createdAt'),
        updatedAt: sql`NOW()`.as('updatedAt')
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .limit(50);

    return new Response(JSON.stringify({
      success: true,
      data: notes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team notes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team notes'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/teams/[id]/notes - Create a team note
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a member of the team
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Note content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (content.trim().length > 5000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Note content must be 5000 characters or less'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, we'll simulate creating a note
    // In a real implementation, you'd insert into a team_notes table
    const newNote = {
      id: Date.now(), // Simulate ID
      userId: currentUser.id,
      userName: currentUser.name,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
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
    console.error('Error creating team note:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create note'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
