import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, timeEntries, users, projects, clients, taskAssignments } from '../../../db/schema';
import { eq, and, desc, gte, lt } from 'drizzle-orm';
import { 
  getUserBySlackId, 
  getWorkspaceById, 
  logSlackCommand, 
  parseSlackTimeInput, 
  formatDurationForSlack 
} from '../../../utils/slack';
// Note: Astro doesn't support bodyParser config like Next.js
// We'll handle raw body access differently

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Slack command received');
    
    // Parse form data
    const formData = await request.formData();
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    const channelId = formData.get('channel_id') as string;

    console.log('Parsed form data:', { command, text, userId, teamId, channelId });

    // Validate required fields
    if (!command || !userId || !teamId || !channelId) {
      console.error('Missing required fields:', { command, userId, teamId, channelId });
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: '❌ Invalid request: Missing required fields'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get workspace
    console.log('Looking up workspace:', teamId);
    const workspace = await getWorkspaceById(teamId);
    if (!workspace) {
      console.log('Workspace not found:', teamId);
      await logSlackCommand(command, userId, teamId, channelId, text, 'Workspace not found', false);
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: '❌ This workspace is not connected to Times10 Time Tracker. Please contact your administrator.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user
    console.log('Looking up user:', userId, 'in workspace:', teamId);
    const user = await getUserBySlackId(userId, teamId);
    if (!user) {
      console.log('User not linked:', userId);
      await logSlackCommand(command, userId, teamId, channelId, text, 'User not linked', false);
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: '❌ Your Slack account is not linked to Times10 Time Tracker. Please link your account first.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User found:', user.id);

    // Parse command
    const args = text ? text.trim().split(/\s+/) : [];
    let response: string;

    console.log('Processing command:', command, 'with args:', args);

    switch (command) {
      case '/track':
        response = await handleTrackCommand(user.id, args, teamId, userId, channelId);
        break;
      case '/tasks':
        response = await handleTasksCommand(user.id);
        break;
      case '/time-status':
        response = await handleStatusCommand(user.id);
        break;
      default:
        response = '❌ Unknown command. Available commands: `/track`, `/tasks`, `/time-status`';
    }

    console.log('Command response:', response);

    await logSlackCommand(command, userId, teamId, channelId, text, response);

    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Slack command error:', error);
    
    // Try to log the error
    try {
      const formData = await request.formData();
      const command = formData.get('command') as string;
      const userId = formData.get('user_id') as string;
      const teamId = formData.get('team_id') as string;
      const channelId = formData.get('channel_id') as string;
      const text = formData.get('text') as string;
      
      await logSlackCommand(command, userId, teamId, channelId, text, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: '❌ An error occurred while processing your command. Please try again.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle /track command
async function handleTrackCommand(userId: number, args: string[], teamId: string, slackUserId: string, channelId: string): Promise<string> {
  if (args.length < 2) {
    return `❌ Usage: /track <task_id> <duration> [notes]
Example: /track 123 2h Working on feature
Example: /track 456 90m Bug fixes`;
  }

  const taskId = parseInt(args[0]);
  const durationStr = args[1];
  const notes = args.slice(2).join(' ');

  if (isNaN(taskId)) {
    return '❌ Invalid task ID. Please provide a valid number.';
  }

  try {
    // Verify task exists and user has access
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

    if (!task) {
      return '❌ Task not found. Please check the task ID.';
    }

    // Check if user is assigned to this task
    const assignment = await db.query.taskAssignments.findFirst({
      where: and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      )
    });

    if (!assignment) {
      return '❌ You are not assigned to this task.';
    }

    // Parse duration
    const durationSeconds = parseSlackTimeInput(durationStr);

    // Create time entry
    const [newEntry] = await db.insert(timeEntries).values({
      taskId,
      userId,
      startTime: new Date(),
      endTime: new Date(),
      durationManual: durationSeconds,
      notes: notes || null
    }).returning();

    const formattedDuration = formatDurationForSlack(durationSeconds);
    
    return `✅ Time tracked successfully!
• Task: ${task.name}
• Project: ${task.project.name}
• Client: ${task.project.client.name}
• Duration: ${formattedDuration}
• Notes: ${notes || 'None'}`;

  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid time format')) {
      return '❌ Invalid time format. Use formats like "2h", "1.5h", "90m", "2 hours", etc.';
    }
    throw error;
  }
}

// Handle /tasks command
async function handleTasksCommand(userId: number): Promise<string> {
  try {
    console.log('Fetching tasks for user:', userId);
    
    // First, get task assignments
    const assignments = await db.query.taskAssignments.findMany({
      where: eq(taskAssignments.userId, userId),
      orderBy: desc(taskAssignments.taskId)
    });

    console.log('Found assignments:', assignments.length);

    if (assignments.length === 0) {
      return '📋 You have no assigned tasks.';
    }

    // Get task details for each assignment
    const taskDetails = await Promise.all(
      assignments.map(async (assignment) => {
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
      })
    );

    const validTasks = taskDetails.filter(task => task !== null);
    
    if (validTasks.length === 0) {
      return '📋 You have no assigned tasks.';
    }

    const taskList = validTasks.map(task => {
      if (!task) return '';
      return `• ID: ${task.id} | ${task.name} (${task.project.name} - ${task.project.client.name})`;
    }).filter(line => line !== '').join('\n');

    return `📋 Your assigned tasks:\n${taskList}`;
  } catch (error) {
    console.error('Error in handleTasksCommand:', error);
    return '❌ Error fetching tasks. Please try again.';
  }
}

// Handle /status command
async function handleStatusCommand(userId: number): Promise<string> {
  try {
    console.log('Fetching time entries for user:', userId);
    
    // Get today's time entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = await db.query.timeEntries.findMany({
      where: and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.startTime, today),
        lt(timeEntries.startTime, tomorrow)
      ),
      orderBy: desc(timeEntries.startTime)
    });

    console.log('Found time entries:', todayEntries.length);

    if (todayEntries.length === 0) {
      return '📊 Today\'s time tracking: No entries yet.';
    }

    // Get task details for each entry
    const entryDetails = await Promise.all(
      todayEntries.map(async (entry) => {
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, entry.taskId),
          with: {
            project: {
              with: {
                client: true
              }
            }
          }
        });
        return { entry, task };
      })
    );

    const totalSeconds = entryDetails.reduce((total, { entry }) => {
      const duration = entry.durationManual || 
        (entry.endTime ? Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000) : 0);
      return total + duration;
    }, 0);

    const formattedTotal = formatDurationForSlack(totalSeconds);
    
    const entryList = entryDetails.slice(0, 5).map(({ entry, task }) => {
      const duration = entry.durationManual || 
        (entry.endTime ? Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000) : 0);
      const formattedDuration = formatDurationForSlack(duration);
      const taskName = task?.name || 'Unknown Task';
      return `• ${taskName} (${formattedDuration})`;
    }).join('\n');

    return `📊 Today's time tracking (${formattedTotal} total):
${entryList}${todayEntries.length > 5 ? '\n... and more' : ''}`;
  } catch (error) {
    console.error('Error in handleStatusCommand:', error);
    return '❌ Error fetching time entries. Please try again.';
  }
}
