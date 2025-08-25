import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, taskAssignments, users, slackUsers } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserBySlackId } from '../../../utils/slack';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Test tasks endpoint hit');
    
    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    
    console.log('Test tasks received:', { userId, teamId });
    
    let testResults = {
      userLookup: false,
      userFound: null as any,
      taskAssignments: [] as any[],
      tasks: [] as any[],
      errors: [] as string[]
    };

    // Test user lookup
    if (userId && teamId) {
      try {
        const user = await getUserBySlackId(userId, teamId);
        testResults.userLookup = !!user;
        testResults.userFound = user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null;
        console.log('User lookup result:', user ? 'Found' : 'Not found');
      } catch (error) {
        testResults.errors.push(`User lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('User lookup failed:', error);
      }
    }

    // Test task assignments
    if (testResults.userFound) {
      try {
        const assignments = await db.query.taskAssignments.findMany({
          where: eq(taskAssignments.userId, testResults.userFound.id),
          orderBy: desc(taskAssignments.taskId)
        });
        testResults.taskAssignments = assignments.map(a => ({
          id: a.id,
          taskId: a.taskId,
          userId: a.userId
        }));
        console.log('Task assignments found:', assignments.length);
      } catch (error) {
        testResults.errors.push(`Task assignments lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Task assignments lookup failed:', error);
      }
    }

    // Test task details
    if (testResults.taskAssignments.length > 0) {
      try {
        const taskIds = testResults.taskAssignments.map(a => a.taskId);
        const taskDetails = await Promise.all(
          taskIds.map(async (taskId) => {
            const task = await db.query.tasks.findFirst({
              where: eq(tasks.id, taskId),
              with: {
                project: {
                  with: {
                    client: true
                  }
                }
              }
            });
            return task;
          })
        );
        testResults.tasks = taskDetails.filter(t => t !== null).map(t => ({
          id: t!.id,
          name: t!.name,
          projectName: t!.project.name,
          clientName: t!.project.client.name
        }));
        console.log('Task details found:', testResults.tasks.length);
      } catch (error) {
        testResults.errors.push(`Task details lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Task details lookup failed:', error);
      }
    }

    // Log the test results
    console.log('Test results:', JSON.stringify(testResults, null, 2));

    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `🧪 Tasks Test Results:
• User Lookup: ${testResults.userLookup ? '✅ Success' : '❌ Failed'}
• User: ${testResults.userFound ? `${testResults.userFound.name} (ID: ${testResults.userFound.id})` : 'Not found'}
• Task Assignments: ${testResults.taskAssignments.length}
• Tasks: ${testResults.tasks.length}
• Errors: ${testResults.errors.length > 0 ? testResults.errors.join(', ') : 'None'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test tasks endpoint error:', error);
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
