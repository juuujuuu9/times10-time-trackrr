import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { taskDiscussions, teams, teamMembers, users, projectTeams } from '../../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/discussions - Get discussions for a collaboration
export const GET: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('taskId');
    
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

    // Get discussions from database
    let discussions: any[] = [];
    if (taskId) {
      // Get discussions for a specific task
      discussions = await db.query.taskDiscussions.findMany({
        where: eq(taskDiscussions.taskId, parseInt(taskId)),
        with: {
          author: true,
          replies: {
            with: {
              author: true
            }
          }
        },
        orderBy: [desc(taskDiscussions.createdAt)]
      });
    } else {
      // Get all discussions for the collaboration by finding tasks linked to this team
      // First, get all projects linked to this team
      const teamProjects = await db.query.projectTeams.findMany({
        where: eq(projectTeams.teamId, collaborationId),
        with: {
          project: {
            with: {
              tasks: true
            }
          }
        }
      });
      
      // Extract all task IDs from the linked projects
      const taskIds = teamProjects.flatMap((tp: any) => tp.project.tasks.map((task: any) => task.id));
      
      if (taskIds.length === 0) {
        discussions = [];
      } else {
        // Get discussions for all tasks in this team's projects
        discussions = await db.query.taskDiscussions.findMany({
          where: sql`${taskDiscussions.taskId} = ANY(${taskIds})`,
          with: {
            author: true,
            replies: {
              with: {
                author: true
              }
            }
          },
          orderBy: [desc(taskDiscussions.createdAt)]
        });
      }
    }

    // Transform the data to match the expected format
    const formattedDiscussions = discussions.map(discussion => ({
      id: discussion.id,
      content: discussion.content,
      author: {
        id: discussion.author.id,
        name: discussion.author.name,
        email: discussion.author.email,
        avatar: discussion.author.avatar
      },
      createdAt: discussion.createdAt.toISOString(),
      comments: discussion.replies?.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author.id,
          name: reply.author.name,
          email: reply.author.email,
          avatar: reply.author.avatar
        },
        createdAt: reply.createdAt.toISOString()
      })) || []
    }));

    return new Response(JSON.stringify({
      success: true,
      data: formattedDiscussions
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
    const { 
      content, 
      type = 'insight', 
      taskId, 
      mediaUrl, 
      linkPreview, 
      subtask 
    } = body;

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the discussion in the database
    const newDiscussion = await db.insert(taskDiscussions).values({
      taskId: taskId ? parseInt(taskId) : null,
      userId: currentUser.id,
      content: content.trim(),
      parentId: null,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Get the created discussion with author info
    const createdDiscussion = await db.query.taskDiscussions.findFirst({
      where: eq(taskDiscussions.id, (newDiscussion as any)[0].id),
      with: {
        author: true
      }
    });

    if (!createdDiscussion) {
      throw new Error('Failed to retrieve created discussion');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: createdDiscussion.id,
        content: createdDiscussion.content,
        author: {
          id: createdDiscussion.author.id,
          name: createdDiscussion.author.name,
          email: createdDiscussion.author.email,
          avatar: createdDiscussion.author.avatar
        },
        createdAt: createdDiscussion.createdAt.toISOString(),
        comments: []
      },
      message: 'Post created successfully'
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
