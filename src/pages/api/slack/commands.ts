import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, timeEntries, users, projects, clients, taskAssignments } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  getUserBySlackId, 
  getWorkspaceById, 
  logSlackCommand, 
  parseSlackTimeInput, 
  formatDurationForSlack 
} from '../../../utils/slack';

export const POST: APIRoute = async ({ request }) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    const formData = await request.formData();
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    const channelId = formData.get('channel_id') as string;

    // Get workspace
    const workspace = await getWorkspaceById(teamId);
    if (!workspace) {
      await logSlackCommand(command, userId, teamId, channelId, text, 'Workspace not found', false);
          return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: '❌ This workspace is not connected to Times10 Time Tracker. Please contact your administrator.'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    }

    // Get user
    const user = await getUserBySlackId(userId, teamId);
    if (!user) {
      await logSlackCommand(command, userId, teamId, channelId, text, 'User not linked', false);
          return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: '❌ Your Slack account is not linked to Times10 Time Tracker. Please link your account first.'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    }

    // Parse command
    const args = text.trim().split(/\s+/);
    let response: string;

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

    await logSlackCommand(command, userId, teamId, channelId, text, response);

    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: response
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Slack command error:', error);
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: '❌ An error occurred while processing your command. Please try again.'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
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
  const userTasks = await db.query.taskAssignments.findMany({
    where: eq(taskAssignments.userId, userId),
    with: {
      task: {
        with: {
          project: {
            with: {
              client: true
            }
          }
        }
      }
    },
    orderBy: desc(taskAssignments.taskId)
  });

  if (userTasks.length === 0) {
    return '📋 You have no assigned tasks.';
  }

  const taskList = userTasks.map(assignment => {
    const task = assignment.task;
    return `• ID: ${task.id} | ${task.name} (${task.project.name} - ${task.project.client.name})`;
  }).join('\n');

  return `📋 Your assigned tasks:\n${taskList}`;
}

// Handle /status command
async function handleStatusCommand(userId: number): Promise<string> {
  // Get today's time entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEntries = await db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.userId, userId),
      eq(timeEntries.startTime, '>=', today),
      eq(timeEntries.startTime, '<', tomorrow)
    ),
    with: {
      task: {
        with: {
          project: {
            with: {
              client: true
            }
          }
        }
      }
    },
    orderBy: desc(timeEntries.startTime)
  });

  if (todayEntries.length === 0) {
    return '📊 Today\'s time tracking: No entries yet.';
  }

  const totalSeconds = todayEntries.reduce((total, entry) => {
    const duration = entry.durationManual || 
      (entry.endTime ? Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000) : 0);
    return total + duration;
  }, 0);

  const formattedTotal = formatDurationForSlack(totalSeconds);
  
  const entryList = todayEntries.slice(0, 5).map(entry => {
    const duration = entry.durationManual || 
      (entry.endTime ? Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000) : 0);
    const formattedDuration = formatDurationForSlack(duration);
    return `• ${entry.task.name} (${formattedDuration})`;
  }).join('\n');

  return `📊 Today's time tracking (${formattedTotal} total):
${entryList}${todayEntries.length > 5 ? '\n... and more' : ''}`;
}
