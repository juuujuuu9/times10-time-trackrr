import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { taskAssignments, users, tasks, projects, clients } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async () => {
  try {
    console.log('🔄 Starting task assignment fix...');

    // Find Mike and George users
    const mike = await db.query.users.findFirst({
      where: (users, { eq, or }) => 
        or(eq(users.name, 'Mike Le'), eq(users.email, 'mike@times10.net'))
    });

    const george = await db.query.users.findFirst({
      where: (users, { eq, or }) => 
        or(eq(users.name, 'George Eubank'), eq(users.email, 'george@times10.net'))
    });

    if (!mike) {
      return new Response(JSON.stringify({ 
        error: 'Mike user not found',
        success: false 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!george) {
      return new Response(JSON.stringify({ 
        error: 'George user not found',
        success: false 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found Mike (ID: ${mike.id}) and George (ID: ${george.id})`);

    // Get all task assignments for Mike
    const mikeAssignments = await db
      .select({
        taskId: taskAssignments.taskId,
        userId: taskAssignments.userId,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name
      })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(taskAssignments.userId, mike.id));

    console.log(`Found ${mikeAssignments.length} task assignments for Mike`);

    if (mikeAssignments.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No task assignments found for Mike',
        success: true,
        updatedCount: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check which tasks are already assigned to George
    const georgeAssignments = await db
      .select({ taskId: taskAssignments.taskId })
      .from(taskAssignments)
      .where(eq(taskAssignments.userId, george.id));

    const georgeTaskIds = georgeAssignments.map(a => a.taskId);

    // Filter out tasks that are already assigned to George
    const tasksToAssign = mikeAssignments.filter(assignment => 
      !georgeTaskIds.includes(assignment.taskId)
    );

    console.log(`${tasksToAssign.length} tasks need to be assigned to George`);

    if (tasksToAssign.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'All tasks are already assigned to George',
        success: true,
        updatedCount: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new assignments for George
    const newAssignments = tasksToAssign.map(assignment => ({
      taskId: assignment.taskId,
      userId: george.id
    }));

    console.log('Creating new assignments for George:', newAssignments);

    // Insert new assignments
    await db.insert(taskAssignments).values(newAssignments);

    console.log(`✅ Successfully assigned ${newAssignments.length} tasks to George`);

    return new Response(JSON.stringify({ 
      message: `Successfully assigned ${newAssignments.length} tasks to George`,
      success: true,
      updatedCount: newAssignments.length,
      mikeTasks: mikeAssignments.length,
      georgeTasks: georgeTaskIds.length,
      newAssignments: newAssignments.length,
      details: {
        mike: { id: mike.id, name: mike.name, email: mike.email },
        george: { id: george.id, name: george.name, email: george.email },
        tasksAssigned: tasksToAssign.map(t => ({
          taskId: t.taskId,
          taskName: t.taskName,
          projectName: t.projectName,
          clientName: t.clientName
        }))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error updating task assignments:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update task assignments',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
