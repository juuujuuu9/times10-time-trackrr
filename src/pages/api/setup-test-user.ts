import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users, sessions, teams, teamMembers, projects, clients, tasks, taskAssignments } from '../../db/schema';
import { hashPassword, generateToken } from '../../utils/auth';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async () => {
  try {
    console.log('Setting up test user with complete team member access...');

    // 1. Create test user
    const testUserEmail = 'user@example.com';
    const testUserPassword = 'user';
    const hashedPassword = await hashPassword(testUserPassword);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, testUserEmail)
    });

    let testUserId: number;

    if (existingUser) {
      console.log('Test user already exists, updating...');
      await db.update(users)
        .set({
          name: 'Test User',
          password: hashedPassword,
          role: 'user',
          status: 'active',
          payRate: '30.00',
          updatedAt: new Date()
        })
        .where(eq(users.email, testUserEmail));
      testUserId = existingUser.id;
    } else {
      console.log('Creating test user...');
      const newUser = await db.insert(users).values({
        email: testUserEmail,
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        status: 'active',
        payRate: '30.00'
      }).returning();
      testUserId = newUser[0].id;
    }

    // 2. Create a session for the test user
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Delete any existing sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, testUserId));
    
    // Create new session
    await db.insert(sessions).values({
      userId: testUserId,
      token,
      expiresAt
    });

    // 3. Create a client and project for the tasks
    console.log('Creating test client and project...');
    
    // Check if test client exists
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.name, 'Test Client')
    });

    let clientId: number;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await db.insert(clients).values({
        name: 'Test Client',
        createdBy: testUserId
      }).returning();
      clientId = newClient[0].id;
    }

    // Check if test project exists
    const existingProject = await db.query.projects.findFirst({
      where: eq(projects.name, 'Test Project')
    });

    let projectId: number;
    if (existingProject) {
      projectId = existingProject.id;
    } else {
      const newProject = await db.insert(projects).values({
        clientId: clientId,
        name: 'Test Project'
      }).returning();
      projectId = newProject[0].id;
    }

    // 4. Create a team/collaboration
    console.log('Creating test team/collaboration...');
    
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.name, 'Test Team')
    });

    let teamId: number;
    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      const newTeam = await db.insert(teams).values({
        name: 'Test Team',
        description: 'Test team for demonstrating team member features',
        projectId: projectId,
        createdBy: testUserId
      }).returning();
      teamId = newTeam[0].id;
    }

    // Add test user as team member
    const existingMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, testUserId)
      )
    });

    if (!existingMembership) {
      await db.insert(teamMembers).values({
        teamId: teamId,
        userId: testUserId,
        role: 'member'
      });
    }

    // 5. Create 3 tasks for time tracking
    console.log('Creating test tasks...');
    
    const taskNames = [
      'Design User Interface',
      'Implement Authentication',
      'Write API Documentation'
    ];

    const createdTasks = [];
    
    for (const taskName of taskNames) {
      // Check if task already exists
      const existingTask = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.name, taskName),
          eq(tasks.projectId, projectId)
        )
      });

      let taskId: number;
      if (existingTask) {
        taskId = existingTask.id;
      } else {
        const newTask = await db.insert(tasks).values({
          projectId: projectId,
          teamId: teamId,
          name: taskName,
          description: `Test task for ${taskName.toLowerCase()}`,
          status: 'pending',
          priority: 'regular'
        }).returning();
        taskId = newTask[0].id;
      }

      // Assign task to test user
      const existingAssignment = await db.query.taskAssignments.findFirst({
        where: and(
          eq(taskAssignments.taskId, taskId),
          eq(taskAssignments.userId, testUserId)
        )
      });

      if (!existingAssignment) {
        await db.insert(taskAssignments).values({
          taskId: taskId,
          userId: testUserId
        });
      }

      createdTasks.push({
        id: taskId,
        name: taskName
      });
    }

    console.log('Test user setup completed successfully!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Test user setup completed successfully!',
      credentials: {
        email: testUserEmail,
        password: testUserPassword,
        sessionToken: token
      },
      user: {
        id: testUserId,
        email: testUserEmail,
        name: 'Test User',
        role: 'user',
        status: 'active'
      },
      team: {
        id: teamId,
        name: 'Test Team',
        projectId: projectId
      },
      tasks: createdTasks,
      loginUrl: '/login'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error setting up test user:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to set up test user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};