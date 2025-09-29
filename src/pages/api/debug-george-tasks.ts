import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { taskAssignments, users, tasks, projects, clients } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Debugging George\'s tasks...');

    // Find George user
    const george = await db.query.users.findFirst({
      where: (users, { eq, or }) => 
        or(eq(users.name, 'George Eubank'), eq(users.email, 'george@times10.net'))
    });

    if (!george) {
      return new Response(JSON.stringify({ 
        error: 'George user not found',
        success: false 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found George (ID: ${george.id})`);

    // Get all task assignments for George
    const georgeAssignments = await db
      .select({
        taskId: taskAssignments.taskId,
        userId: taskAssignments.userId,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        taskArchived: tasks.archived,
        projectArchived: projects.archived,
        clientArchived: clients.archived
      })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(taskAssignments.userId, george.id));

    console.log(`Found ${georgeAssignments.length} task assignments for George`);

    return new Response(JSON.stringify({ 
      message: `Found ${georgeAssignments.length} task assignments for George`,
      success: true,
      george: {
        id: george.id,
        name: george.name,
        email: george.email
      },
      assignments: georgeAssignments.map(assignment => ({
        taskId: assignment.taskId,
        taskName: assignment.taskName,
        projectName: assignment.projectName,
        clientName: assignment.clientName,
        taskArchived: assignment.taskArchived,
        projectArchived: assignment.projectArchived,
        clientArchived: assignment.clientArchived
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error debugging George\'s tasks:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug George\'s tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
