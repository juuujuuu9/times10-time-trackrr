import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { taskAssignments, tasks, users, slackUsers } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserBySlackId } from '../../../utils/slack';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('Check user tasks endpoint hit');
    
    const searchParams = url.searchParams;
    const slackUserId = searchParams.get('slackUserId');
    const workspaceId = searchParams.get('workspaceId');
    
    if (!slackUserId || !workspaceId) {
      return new Response(JSON.stringify({
        error: 'Missing slackUserId or workspaceId parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Checking tasks for user:', slackUserId, 'in workspace:', workspaceId);
    
    // Get user
    const user = await getUserBySlackId(slackUserId, workspaceId);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found',
        slackUserId,
        workspaceId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('User found:', user.id, user.name);
    
    // Get task assignments
    const assignments = await db.query.taskAssignments.findMany({
      where: eq(taskAssignments.userId, user.id),
      orderBy: desc(taskAssignments.taskId)
    });
    
    console.log('Found assignments:', assignments.length);
    
    // Get task details
    const taskDetails = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, assignment.taskId),
            with: {
              project: {
                with: {
                  client: true
                }
              }
            }
          });
          return task;
        } catch (error) {
          console.error(`Error fetching task ${assignment.taskId}:`, error);
          return null;
        }
      })
    );
    
    const validTasks = taskDetails.filter(task => task !== null);
    
    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      assignments: assignments.length,
      tasks: validTasks.map(task => ({
        id: task!.id,
        name: task!.name,
        projectName: task!.project.name,
        clientName: task!.project.client.name
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Check user tasks error:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
