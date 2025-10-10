import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { taskDiscussions, teams, teamMembers, users } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/discussions - Get discussions for a collaboration
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

    // For now, return mock data since we don't have discussions linked to collaborations yet
    // TODO: Implement proper discussion system for collaborations
    const mockDiscussions = [
      {
        id: 1,
        content: "Should we move the onboarding tooltip to appear after the user creates the first task?",
        author: {
          id: 1,
          name: "Mark Chen",
          email: "mark@example.com"
        },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        replies: [
          {
            id: 2,
            content: "Yes, that reduces cognitive load on first run. Let's A/B test it this week.",
            author: {
              id: 2,
              name: "Alex Rivera",
              email: "alex@example.com"
            },
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            parentId: 1
          }
        ]
      },
      {
        id: 3,
        content: "Sharing final icons for review.",
        author: {
          id: 3,
          name: "Lina Gomez",
          email: "lina@example.com"
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        replies: []
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: mockDiscussions
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaboration discussions:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch discussions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/collaborations/[id]/discussions - Create a new discussion or reply
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
    const { content, parentId } = body;

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discussion content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return success without actually creating the discussion
    // TODO: Implement proper discussion creation system for collaborations
    const newDiscussion = {
      id: Date.now(), // Temporary ID
      content: content.trim(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      },
      createdAt: new Date(),
      parentId: parentId || null,
      replies: []
    };

    return new Response(JSON.stringify({
      success: true,
      data: newDiscussion,
      message: parentId ? 'Reply created successfully' : 'Discussion created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating discussion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create discussion'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
