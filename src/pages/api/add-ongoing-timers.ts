import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users, clients, projects, tasks, timeEntries } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole('admin', '/admin')(context) as any;
    
    console.log('Adding ongoing timers for all users...');

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users`);

    if (allUsers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No active users found' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a default client if none exist
    const existingClients = await db.select().from(clients);
    let defaultClientId: number;

    if (existingClients.length === 0) {
      console.log('Creating default client...');
      const [defaultClient] = await db.insert(clients).values({
        name: 'Internal Projects',
        createdBy: allUsers[0].id
      }).returning();
      defaultClientId = defaultClient.id;
    } else {
      defaultClientId = existingClients[0].id;
    }

    // Create a default project if none exist
    const existingProjects = await db.select().from(projects);
    let defaultProjectId: number;

    if (existingProjects.length === 0) {
      console.log('Creating default project...');
      const [defaultProject] = await db.insert(projects).values({
        name: 'General Tasks',
        clientId: defaultClientId
      }).returning();
      defaultProjectId = defaultProject.id;
    } else {
      defaultProjectId = existingProjects[0].id;
    }

    // Create tasks for each user if none exist
    const existingTasks = await db.select().from(tasks);
    let userTasks: { userId: number; taskId: number; userName: string }[] = [];

    if (existingTasks.length === 0) {
      console.log('Creating tasks for each user...');
      for (const user of allUsers) {
        const [task] = await db.insert(tasks).values({
          name: `${user.name}'s Current Task`,
          description: `Ongoing work for ${user.name}`,
          projectId: defaultProjectId,
          status: 'in_progress'
        }).returning();
        userTasks.push({ userId: user.id, taskId: task.id, userName: user.name });
      }
    } else {
      // Use existing tasks and assign them to users
      for (let i = 0; i < allUsers.length; i++) {
        const taskIndex = i % existingTasks.length;
        userTasks.push({ 
          userId: allUsers[i].id, 
          taskId: existingTasks[taskIndex].id,
          userName: allUsers[i].name
        });
      }
    }

    // Add ongoing time entries for each user
    console.log('Adding ongoing time entries...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const addedTimers: any[] = [];

    for (const { userId, taskId, userName } of userTasks) {
      // Check if user already has an ongoing timer
      const existingOngoingTimer = await db.select()
        .from(timeEntries)
        .where(and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.taskId, taskId),
          isNull(timeEntries.endTime)
        ));

      if (existingOngoingTimer.length === 0) {
        console.log(`Adding ongoing timer for user ${userName} on task ${taskId}...`);
        const [newTimer] = await db.insert(timeEntries).values({
          userId: userId,
          taskId: taskId,
          startTime: oneHourAgo,
          endTime: null, // Ongoing timer
          notes: 'Ongoing work session'
        }).returning();
        
        addedTimers.push({
          id: newTimer.id,
          userId: userId,
          userName: userName,
          taskId: taskId,
          startTime: newTimer.startTime
        });
      } else {
        console.log(`User ${userName} already has an ongoing timer on task ${taskId}`);
      }
    }

    // Get final summary
    const finalTimeEntries = await db.select()
      .from(timeEntries)
      .where(isNull(timeEntries.endTime));
    
    console.log('Ongoing timers added successfully!');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Ongoing timers added successfully!',
      summary: {
        totalOngoingTimers: finalTimeEntries.length,
        usersWithTimers: new Set(finalTimeEntries.map(te => te.userId)).size,
        addedTimers: addedTimers
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error adding ongoing timers:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error adding ongoing timers',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
