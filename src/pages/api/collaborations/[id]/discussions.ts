import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { taskDiscussions, teams, teamMembers, users, tasks } from '../../../../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';
import { NotificationService } from '../../../../services/notificationService';

// GET /api/collaborations/[id]/discussions - Get discussions for a collaboration
export const GET: APIRoute = async (context) => {
  try {
    console.log('🚀 GET /api/collaborations/[id]/discussions called');
    const collaborationId = parseInt(context.params.id!);
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('taskId');
    console.log('📋 Request params:', { collaborationId, taskId });
    
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
      console.log('🔍 Fetching discussions for task ID:', taskId);
      // Get discussions for a specific task
      discussions = await db.query.taskDiscussions.findMany({
        where: and(
          eq(taskDiscussions.taskId, parseInt(taskId)),
          eq(taskDiscussions.archived, false)
        ),
        with: {
          user: true
        },
        orderBy: [desc(taskDiscussions.createdAt)]
      });
      console.log('📊 Found discussions for task:', discussions.length);
      if (discussions.length > 0) {
        console.log('Sample discussion:', {
          id: discussions[0].id,
          content: discussions[0].content,
          taskId: discussions[0].taskId,
          archived: discussions[0].archived,
          user: discussions[0].user?.name || 'No user'
        });
      }
    } else {
      // Get all discussions for the collaboration by finding tasks linked to this team
      // First, get all projects linked to this team
      // Get project through direct team relationship
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, collaborationId),
        with: {
          project: {
            with: {
              tasks: true
            }
          }
        }
      });
      
      // Extract all task IDs from the linked projects
      const taskIds = (team as any)?.project?.tasks?.map((task: any) => task.id) || [];
      
      if (taskIds.length === 0) {
        console.log('📊 No tasks found for team, returning empty discussions');
        discussions = [];
      } else {
        console.log('📊 Found task IDs for team:', taskIds);
        // Get discussions for all tasks in this team's projects
        discussions = await db.query.taskDiscussions.findMany({
          where: and(
            inArray(taskDiscussions.taskId, taskIds),
            eq(taskDiscussions.archived, false)
          ),
          with: {
            user: true
          },
          orderBy: [desc(taskDiscussions.createdAt)]
        });
        console.log('📊 Found discussions for team tasks:', discussions.length);
      }
    }

    // Transform the data to match the expected format
    const formattedDiscussions = discussions.map(discussion => ({
      id: discussion.id,
      type: 'insight', // Default type for discussions
      content: discussion.content,
      author: {
        id: discussion.user.id,
        name: discussion.user.name,
        email: discussion.user.email,
        avatar: discussion.user.avatar
      },
      createdAt: discussion.createdAt.toISOString(),
      likes: 0, // Default likes count
      comments: [] // TODO: Load replies separately if needed
    }));
    
    console.log('📤 Returning formatted discussions:', formattedDiscussions.length);
    if (formattedDiscussions.length > 0) {
      console.log('📋 Sample formatted discussion:', {
        id: formattedDiscussions[0].id,
        content: formattedDiscussions[0].content,
        author: formattedDiscussions[0].author?.name || 'No author'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: formattedDiscussions
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching collaboration discussions:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch discussions',
      details: error instanceof Error ? error.message : 'Unknown error'
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
      subtask,
      mentionedUsers = []
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
    console.log('💾 Creating discussion with data:', {
      taskId: taskId ? parseInt(taskId) : null,
      userId: currentUser.id,
      content: content.trim(),
      parentId: null,
      archived: false
    });
    
    // Ensure taskId is provided since it's required in the schema
    if (!taskId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Task ID is required for creating discussions'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const newDiscussion = await db.insert(taskDiscussions).values({
      taskId: parseInt(taskId),
      userId: currentUser.id,
      content: content.trim(),
      parentId: null,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ Discussion created:', newDiscussion);

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

    // Send notifications for mentioned users
    if (mentionedUsers && mentionedUsers.length > 0 && taskId) {
      try {
        // Get task details for notification
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, parseInt(taskId)),
          with: {
            project: true
          }
        });

        if (task) {
          await NotificationService.createMentionNotifications(
            mentionedUsers,
            currentUser.name,
            task.name,
            createdDiscussion.id
          );
          console.log(`📧 Mention notifications sent to ${mentionedUsers.length} users`);
        }
      } catch (notificationError) {
        console.error('Error sending mention notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
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
    console.error('❌ Error creating discussion:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create discussion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
