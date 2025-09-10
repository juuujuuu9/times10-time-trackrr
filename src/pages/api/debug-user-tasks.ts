import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Debugging tasks for user: ${user.name} (${user.email})`);

    // Get all task assignments for this user
    const userAssignments = await db
      .select({
        taskId: taskAssignments.taskId,
        userId: taskAssignments.userId,
        taskName: tasks.name,
        taskIsSystem: tasks.isSystem,
        projectName: projects.name,
        projectIsSystem: projects.isSystem,
        clientName: clients.name,
        clientArchived: clients.archived
      })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(taskAssignments.userId, user.id));

    console.log(`Found ${userAssignments.length} task assignments for user ${user.id}`);

    // Separate regular and system tasks
    const regularTasks = userAssignments.filter(assignment => !assignment.taskIsSystem);
    const systemTasks = userAssignments.filter(assignment => assignment.taskIsSystem);

    // Get all general tasks in the system
    const allGeneralTasks = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        isSystem: tasks.isSystem,
        projectName: projects.name,
        projectIsSystem: projects.isSystem,
        clientName: clients.name,
        clientArchived: clients.archived
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(tasks.name, 'General'),
        eq(tasks.isSystem, true),
        eq(projects.isSystem, true),
        eq(clients.archived, false)
      ));

    console.log(`Found ${allGeneralTasks.length} general tasks in the system`);

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      taskAssignments: {
        total: userAssignments.length,
        regular: regularTasks.length,
        system: systemTasks.length,
        details: userAssignments
      },
      generalTasksInSystem: {
        total: allGeneralTasks.length,
        details: allGeneralTasks
      },
      missingGeneralTasks: allGeneralTasks.filter(generalTask => 
        !userAssignments.some(assignment => assignment.taskId === generalTask.id)
      )
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error debugging user tasks:', error);
    return new Response(JSON.stringify({
      error: 'Failed to debug user tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
