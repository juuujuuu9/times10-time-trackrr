import { db } from '../db';
import { users, clients, projects, tasks, timeEntries } from '../db/schema';
import { hashPassword } from '../utils/auth';
import { eq, and } from 'drizzle-orm';

async function addOngoingTimers() {
  try {
    console.log('Adding ongoing timers for all users...');

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users`);

    if (allUsers.length === 0) {
      console.log('No active users found. Creating demo users first...');
      await createDemoUsers();
      const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
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
    let userTasks: { userId: number; taskId: number }[] = [];

    if (existingTasks.length === 0) {
      console.log('Creating tasks for each user...');
      for (const user of allUsers) {
        const [task] = await db.insert(tasks).values({
          name: `${user.name}'s Current Task`,
          description: `Ongoing work for ${user.name}`,
          projectId: defaultProjectId,
          status: 'in_progress'
        }).returning();
        userTasks.push({ userId: user.id, taskId: task.id });
      }
    } else {
      // Use existing tasks and assign them to users
      for (let i = 0; i < allUsers.length; i++) {
        const taskIndex = i % existingTasks.length;
        userTasks.push({ 
          userId: allUsers[i].id, 
          taskId: existingTasks[taskIndex].id 
        });
      }
    }

    // Add ongoing time entries for each user
    console.log('Adding ongoing time entries...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    for (const { userId, taskId } of userTasks) {
      // Check if user already has an ongoing timer
      const existingOngoingTimer = await db.select()
        .from(timeEntries)
        .where(and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.taskId, taskId),
          isNull(timeEntries.endTime)
        ));

      if (existingOngoingTimer.length === 0) {
        console.log(`Adding ongoing timer for user ${userId} on task ${taskId}...`);
        await db.insert(timeEntries).values({
          userId: userId,
          taskId: taskId,
          startTime: oneHourAgo,
          endTime: null, // Ongoing timer
          notes: 'Ongoing work session'
        });
      } else {
        console.log(`User ${userId} already has an ongoing timer on task ${taskId}`);
      }
    }

    console.log('Ongoing timers added successfully!');
    
    // Display summary
    const finalTimeEntries = await db.select()
      .from(timeEntries)
      .where(isNull(timeEntries.endTime));
    
    console.log(`\nSummary:`);
    console.log(`- Total ongoing timers: ${finalTimeEntries.length}`);
    console.log(`- Users with ongoing timers: ${new Set(finalTimeEntries.map(te => te.userId)).size}`);

  } catch (error) {
    console.error('Error adding ongoing timers:', error);
  }
}

async function createDemoUsers() {
  const demoUsers = [
    {
      email: 'admin@times10.com',
      name: 'Admin User',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      payRate: '50.00'
    },
    {
      email: 'manager@times10.com',
      name: 'Manager User',
      password: 'manager123',
      role: 'manager',
      status: 'active',
      payRate: '35.00'
    },
    {
      email: 'user@times10.com',
      name: 'Regular User',
      password: 'user123',
      role: 'user',
      status: 'active',
      payRate: '25.00'
    }
  ];

  for (const userData of demoUsers) {
    const hashedPassword = await hashPassword(userData.password);
    
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length === 0) {
      console.log(`Creating user ${userData.email}...`);
      await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
        payRate: userData.payRate
      });
    }
  }
}

// Run the script
addOngoingTimers()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
