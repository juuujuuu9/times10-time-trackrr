import { db } from '../db/index';
import { taskAssignments, users, tasks, projects, clients } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function updateTaskAssignments() {
  try {
    console.log('🔄 Starting task assignment update...');

    // Find Mike and George users
    const mike = await db.query.users.findFirst({
      where: (users, { eq, or }) => 
        or(eq(users.name, 'Mike'), eq(users.email, 'mike@example.com'))
    });

    const george = await db.query.users.findFirst({
      where: (users, { eq, or }) => 
        or(eq(users.name, 'George'), eq(users.email, 'george@example.com'))
    });

    if (!mike) {
      console.error('❌ Mike user not found');
      return;
    }

    if (!george) {
      console.error('❌ George user not found');
      return;
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
      console.log('No task assignments found for Mike');
      return;
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
      console.log('All tasks are already assigned to George');
      return;
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

    // Optionally, remove Mike's assignments (uncomment if needed)
    // console.log('Removing Mike\'s assignments...');
    // await db.delete(taskAssignments).where(eq(taskAssignments.userId, mike.id));
    // console.log('✅ Removed Mike\'s assignments');

    console.log('🎉 Task assignment update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating task assignments:', error);
    throw error;
  }
}

// Run the update
updateTaskAssignments()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
