import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { teams, teamMembers, users } from '../../../../db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/search - Search across notes, discussions, files, and links
export const GET: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    const url = new URL(context.request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all'; // all, notes, insights, files, links
    
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

    if (!query.trim()) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          notes: [],
          insights: [],
          files: [],
          links: []
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return mock search results since we don't have real data yet
    // TODO: Implement proper search across collaboration data
    const searchResults = {
      notes: type === 'all' || type === 'notes' ? [
        {
          id: 1,
          title: "Project Kickoff Notes",
          content: "Outlined the QA checklist and assigned owners for each module. Please review before handoff.",
          author: {
            id: 1,
            name: "Priya Shah",
            email: "priya@example.com"
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'note',
          relevanceScore: 0.9
        }
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase())
      ) : [],
      
      insights: type === 'all' || type === 'insights' ? [
        {
          id: 1,
          content: "Should we move the onboarding tooltip to appear after the user creates the first task?",
          author: {
            id: 1,
            name: "Mark Chen",
            email: "mark@example.com"
          },
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          type: 'insight',
          relevanceScore: 0.8
        },
        {
          id: 2,
          content: "Yes, that reduces cognitive load on first run. Let's A/B test it this week.",
          author: {
            id: 2,
            name: "Alex Rivera",
            email: "alex@example.com"
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          parentId: 1,
          type: 'insight',
          relevanceScore: 0.7
        }
      ].filter(item => 
        item.content.toLowerCase().includes(query.toLowerCase())
      ) : [],
      
      files: type === 'all' || type === 'files' ? [
        {
          id: 1,
          name: "Requirements v3.pdf",
          type: "file",
          author: {
            id: 1,
            name: "Priya",
            email: "priya@example.com"
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          size: "1.2MB",
          mimeType: "application/pdf",
          relevanceScore: 0.6
        }
      ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      ) : [],
      
      links: type === 'all' || type === 'links' ? [
        {
          id: 1,
          title: "Figma Board",
          url: "https://figma.com/design/example",
          type: "link",
          author: {
            id: 2,
            name: "Mark",
            email: "mark@example.com"
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          description: "Main design board for the project",
          relevanceScore: 0.5
        }
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.url.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      ) : []
    };

    // Sort all results by relevance score
    const allResults = [
      ...searchResults.notes,
      ...searchResults.insights,
      ...searchResults.files,
      ...searchResults.links
    ].sort((a, b) => b.relevanceScore - a.relevanceScore);

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: allResults,
        totalResults: allResults.length,
        query: query,
        type: type
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error searching collaboration:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to search collaboration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
