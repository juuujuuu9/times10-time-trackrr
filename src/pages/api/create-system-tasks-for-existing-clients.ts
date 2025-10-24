import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { clients, projects, tasks, users, taskAssignments } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireRole } from '../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole(context, 'admin', '/admin') as any;
    
    console.log('🔄 Creating system tasks for existing clients...');

    // Get all active clients
    const allClients = await db.select().from(clients).where(eq(clients.archived, false));
    console.log(`Found ${allClients.length} active clients`);

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users`);

    if (allUsers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No active users found. Cannot create system tasks.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let createdProjects = 0;
    let createdTasks = 0;
    let assignedTasks = 0;
    const results: any[] = [];

    for (const client of allClients) {
      console.log(`\n📁 Processing client: ${client.name}`);
      const clientResult = { clientName: client.name, projectCreated: false, taskCreated: false, assignmentsCreated: 0 };

      // Check if this client already has a "Time Tracking" project
      const existingProject = await db.query.projects.findFirst({
        where: (projects, { eq, and }) => 
          and(eq(projects.clientId, client.id), eq(projects.name, 'Time Tracking'))
      });

      let projectId: number;

      if (existingProject) {
        console.log(`  ✅ Time Tracking project already exists for ${client.name}`);
        projectId = existingProject.id;
      } else {
        // Create the "Time Tracking" project using raw SQL to avoid field mapping issues
        const projectResult = await db.execute(sql`
          INSERT INTO projects (name, client_id, is_system) 
          VALUES ('Time Tracking', ${client.id}, true) 
          RETURNING id, name, client_id, is_system
        `);
        const newProject = projectResult[0];
        
        projectId = newProject.id;
        createdProjects++;
        clientResult.projectCreated = true;
        console.log(`  ✅ Created Time Tracking project for ${client.name}`);
      }

      // Check if this project already has a "General" task
      const existingTask = await db.query.tasks.findFirst({
        where: (tasks, { eq, and }) => 
          and(eq(tasks.projectId, projectId), eq(tasks.name, 'General'))
      });

      let taskId: number;

      if (existingTask) {
        console.log(`  ✅ General task already exists for ${client.name}`);
        taskId = existingTask.id;
      } else {
        // Create the "General" task using raw SQL to avoid field mapping issues
        const taskResult = await db.execute(sql`
          INSERT INTO tasks (project_id, name, description, is_system) 
          VALUES (${projectId}, 'General', ${`General time tracking for ${client.name}`}, true) 
          RETURNING id, project_id, name, description, is_system
        `);
        const newTask = taskResult[0];
        
        taskId = newTask.id;
        createdTasks++;
        clientResult.taskCreated = true;
        console.log(`  ✅ Created General task for ${client.name}`);
      }

      // Check if the task is already assigned to all users
      const existingAssignments = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
      
      if (existingAssignments.length === allUsers.length) {
        console.log(`  ✅ General task already assigned to all users for ${client.name}`);
      } else {
        // Assign the task to all users who don't already have it
        const existingUserIds = existingAssignments.map(assignment => assignment.userId);
        const usersToAssign = allUsers.filter(user => !existingUserIds.includes(user.id));
        
        if (usersToAssign.length > 0) {
          const newAssignments = usersToAssign.map(user => ({
            taskId: taskId,
            userId: user.id,
          }));

          await db.insert(taskAssignments).values(newAssignments);
          assignedTasks += usersToAssign.length;
          clientResult.assignmentsCreated = usersToAssign.length;
          console.log(`  ✅ Assigned General task to ${usersToAssign.length} users for ${client.name}`);
        }
      }

      results.push(clientResult);
    }

    console.log(`\n🎉 Summary:`);
    console.log(`  📁 Created ${createdProjects} new Time Tracking projects`);
    console.log(`  📋 Created ${createdTasks} new General tasks`);
    console.log(`  👥 Assigned ${assignedTasks} new task assignments`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'System tasks created successfully',
      summary: {
        clientsProcessed: allClients.length,
        projectsCreated: createdProjects,
        tasksCreated: createdTasks,
        assignmentsCreated: assignedTasks
      },
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error creating system tasks:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to create system tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
