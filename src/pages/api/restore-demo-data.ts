import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users, clients, projects, tasks, taskAssignments, timeEntries } from '../../db/schema';
import { hashPassword } from '../../utils/auth';

export const POST: APIRoute = async () => {
  try {
    console.log('🔄 Starting demo data restoration via API...');

    // 1. Create users with hashed passwords
    console.log('👥 Creating users...');
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
      },
      {
        email: 'john@times10.com',
        name: 'John Developer',
        password: 'password123',
        role: 'user',
        status: 'active',
        payRate: '30.00'
      },
      {
        email: 'sarah@times10.com',
        name: 'Sarah Designer',
        password: 'password123',
        role: 'user',
        status: 'active',
        payRate: '28.00'
      }
    ];

    const createdUsers = [];
    for (const userData of demoUsers) {
      const hashedPassword = await hashPassword(userData.password);
      
      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email)
      });

      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`);
        createdUsers.push(existingUser);
      } else {
        const newUser = await db.insert(users).values({
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          status: userData.status,
          payRate: userData.payRate
        }).returning();
        console.log(`✅ Created user ${userData.email}`);
        createdUsers.push(newUser[0]);
      }
    }

    // 2. Create clients
    console.log('🏢 Creating clients...');
    const demoClients = [
      {
        name: 'Acme Corporation',
        createdBy: createdUsers.find(u => u.email === 'admin@times10.com')?.id || 1
      },
      {
        name: 'TechStart Inc',
        createdBy: createdUsers.find(u => u.email === 'admin@times10.com')?.id || 1
      },
      {
        name: 'Global Solutions',
        createdBy: createdUsers.find(u => u.email === 'admin@times10.com')?.id || 1
      },
      {
        name: 'Innovation Labs',
        createdBy: createdUsers.find(u => u.email === 'admin@times10.com')?.id || 1
      }
    ];

    const createdClients = [];
    for (const clientData of demoClients) {
      const existingClient = await db.query.clients.findFirst({
        where: (clients, { eq }) => eq(clients.name, clientData.name)
      });

      if (existingClient) {
        console.log(`✅ Client ${clientData.name} already exists`);
        createdClients.push(existingClient);
      } else {
        const newClient = await db.insert(clients).values(clientData).returning();
        console.log(`✅ Created client ${clientData.name}`);
        createdClients.push(newClient[0]);
      }
    }

    // 3. Create projects
    console.log('📁 Creating projects...');
    const demoProjects = [
      {
        name: 'Website Redesign',
        clientId: createdClients.find(c => c.name === 'Acme Corporation')?.id || 1
      },
      {
        name: 'Mobile App Development',
        clientId: createdClients.find(c => c.name === 'TechStart Inc')?.id || 1
      },
      {
        name: 'E-commerce Platform',
        clientId: createdClients.find(c => c.name === 'Global Solutions')?.id || 1
      },
      {
        name: 'API Integration',
        clientId: createdClients.find(c => c.name === 'Innovation Labs')?.id || 1
      },
      {
        name: 'Brand Identity',
        clientId: createdClients.find(c => c.name === 'Acme Corporation')?.id || 1
      }
    ];

    const createdProjects = [];
    for (const projectData of demoProjects) {
      const existingProject = await db.query.projects.findFirst({
        where: (projects, { eq, and }) => 
          and(eq(projects.name, projectData.name), eq(projects.clientId, projectData.clientId))
      });

      if (existingProject) {
        console.log(`✅ Project ${projectData.name} already exists`);
        createdProjects.push(existingProject);
      } else {
        const newProject = await db.insert(projects).values(projectData).returning();
        console.log(`✅ Created project ${projectData.name}`);
        createdProjects.push(newProject[0]);
      }
    }

    // 4. Create tasks
    console.log('📋 Creating tasks...');
    const demoTasks = [
      {
        name: 'Design Homepage',
        description: 'Create modern homepage design with responsive layout',
        projectId: createdProjects.find(p => p.name === 'Website Redesign')?.id || 1,
        status: 'in-progress'
      },
      {
        name: 'Implement User Authentication',
        description: 'Build secure user authentication system',
        projectId: createdProjects.find(p => p.name === 'Mobile App Development')?.id || 1,
        status: 'completed'
      },
      {
        name: 'Database Schema Design',
        description: 'Design and implement database schema',
        projectId: createdProjects.find(p => p.name === 'E-commerce Platform')?.id || 1,
        status: 'pending'
      },
      {
        name: 'API Documentation',
        description: 'Create comprehensive API documentation',
        projectId: createdProjects.find(p => p.name === 'API Integration')?.id || 1,
        status: 'in-progress'
      },
      {
        name: 'Logo Design',
        description: 'Design new company logo and brand elements',
        projectId: createdProjects.find(p => p.name === 'Brand Identity')?.id || 1,
        status: 'completed'
      },
      {
        name: 'Frontend Development',
        description: 'Build responsive frontend components',
        projectId: createdProjects.find(p => p.name === 'Website Redesign')?.id || 1,
        status: 'pending'
      },
      {
        name: 'Backend API Development',
        description: 'Develop RESTful API endpoints',
        projectId: createdProjects.find(p => p.name === 'Mobile App Development')?.id || 1,
        status: 'in-progress'
      }
    ];

    const createdTasks = [];
    for (const taskData of demoTasks) {
      const existingTask = await db.query.tasks.findFirst({
        where: (tasks, { eq, and }) => 
          and(eq(tasks.name, taskData.name), eq(tasks.projectId, taskData.projectId))
      });

      if (existingTask) {
        console.log(`✅ Task ${taskData.name} already exists`);
        createdTasks.push(existingTask);
      } else {
        const newTask = await db.insert(tasks).values(taskData).returning();
        console.log(`✅ Created task ${taskData.name}`);
        createdTasks.push(newTask[0]);
      }
    }

    // 5. Assign tasks to users
    console.log('👤 Assigning tasks to users...');
    const taskAssignmentsData = [
      {
        taskId: createdTasks.find(t => t.name === 'Design Homepage')?.id || 1,
        userId: createdUsers.find(u => u.email === 'sarah@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'Implement User Authentication')?.id || 1,
        userId: createdUsers.find(u => u.email === 'john@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'Database Schema Design')?.id || 1,
        userId: createdUsers.find(u => u.email === 'john@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'API Documentation')?.id || 1,
        userId: createdUsers.find(u => u.email === 'user@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'Logo Design')?.id || 1,
        userId: createdUsers.find(u => u.email === 'sarah@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'Frontend Development')?.id || 1,
        userId: createdUsers.find(u => u.email === 'user@times10.com')?.id || 1
      },
      {
        taskId: createdTasks.find(t => t.name === 'Backend API Development')?.id || 1,
        userId: createdUsers.find(u => u.email === 'john@times10.com')?.id || 1
      }
    ];

    let assignmentsCreated = 0;
    for (const assignment of taskAssignmentsData) {
      const existingAssignment = await db.query.taskAssignments.findFirst({
        where: (taskAssignments, { eq, and }) => 
          and(eq(taskAssignments.taskId, assignment.taskId), eq(taskAssignments.userId, assignment.userId))
      });

      if (!existingAssignment) {
        await db.insert(taskAssignments).values(assignment);
        assignmentsCreated++;
      }
    }

    // 6. Create time entries
    console.log('⏱️ Creating time entries...');
    const timeEntriesData = [
      {
        taskId: createdTasks.find(t => t.name === 'Design Homepage')?.id || 1,
        userId: createdUsers.find(u => u.email === 'sarah@times10.com')?.id || 1,
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T12:00:00Z'),
        durationManual: 10800, // 3 hours
        notes: 'Created initial homepage mockups and wireframes'
      },
      {
        taskId: createdTasks.find(t => t.name === 'Implement User Authentication')?.id || 1,
        userId: createdUsers.find(u => u.email === 'john@times10.com')?.id || 1,
        startTime: new Date('2024-01-15T13:00:00Z'),
        endTime: new Date('2024-01-15T17:00:00Z'),
        durationManual: 14400, // 4 hours
        notes: 'Implemented JWT authentication and user registration'
      },
      {
        taskId: createdTasks.find(t => t.name === 'API Documentation')?.id || 1,
        userId: createdUsers.find(u => u.email === 'user@times10.com')?.id || 1,
        startTime: new Date('2024-01-16T10:00:00Z'),
        endTime: new Date('2024-01-16T15:00:00Z'),
        durationManual: 18000, // 5 hours
        notes: 'Wrote comprehensive API documentation with examples'
      },
      {
        taskId: createdTasks.find(t => t.name === 'Logo Design')?.id || 1,
        userId: createdUsers.find(u => u.email === 'sarah@times10.com')?.id || 1,
        startTime: new Date('2024-01-16T09:00:00Z'),
        endTime: new Date('2024-01-16T11:30:00Z'),
        durationManual: 9000, // 2.5 hours
        notes: 'Designed new logo and brand guidelines'
      },
      {
        taskId: createdTasks.find(t => t.name === 'Database Schema Design')?.id || 1,
        userId: createdUsers.find(u => u.email === 'john@times10.com')?.id || 1,
        startTime: new Date('2024-01-17T08:00:00Z'),
        endTime: new Date('2024-01-17T12:00:00Z'),
        durationManual: 14400, // 4 hours
        notes: 'Designed normalized database schema with relationships'
      }
    ];

    let timeEntriesCreated = 0;
    for (const entry of timeEntriesData) {
      const existingEntry = await db.query.timeEntries.findFirst({
        where: (timeEntries, { eq, and }) => 
          and(eq(timeEntries.projectId, entry.taskId), eq(timeEntries.userId, entry.userId), eq(timeEntries.startTime, entry.startTime))
      });

      if (!existingEntry) {
        await db.insert(timeEntries).values(entry);
        timeEntriesCreated++;
      }
    }

    console.log('🎉 Demo data restoration completed successfully!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Demo data restored successfully!',
      summary: {
        users: createdUsers.length,
        clients: createdClients.length,
        projects: createdProjects.length,
        tasks: createdTasks.length,
        assignments: assignmentsCreated,
        timeEntries: timeEntriesCreated
      },
      credentials: {
        admin: 'admin@times10.com / admin123',
        manager: 'manager@times10.com / manager123',
        user: 'user@times10.com / user123',
        john: 'john@times10.com / password123',
        sarah: 'sarah@times10.com / password123'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error restoring demo data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to restore demo data',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 