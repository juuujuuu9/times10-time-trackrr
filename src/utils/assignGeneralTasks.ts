import { db } from '../db/index';
import { tasks, projects, clients, taskAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Assigns all existing general tasks from all clients to a newly activated user
 * @param userId - The ID of the user to assign tasks to
 * @returns Promise<number> - The number of tasks assigned
 */
export async function assignGeneralTasksToUser(userId: number): Promise<number> {
  try {
    console.log(`🔄 Assigning general tasks to user ${userId}...`);

    // Get all system-generated "General" tasks from all clients
    const generalTasks = await db.query.tasks.findMany({
      where: (tasks, { eq, and }) => 
        and(eq(tasks.isSystem, true), eq(tasks.name, 'General')),
      with: {
        project: {
          with: {
            client: true
          }
        }
      }
    });

    console.log(`Found ${generalTasks.length} general tasks to assign`);

    if (generalTasks.length === 0) {
      console.log('No general tasks found to assign');
      return 0;
    }

    // Check which tasks are already assigned to this user
    const existingAssignments = await db.select().from(taskAssignments).where(eq(taskAssignments.userId, userId));
    const existingTaskIds = existingAssignments.map(assignment => assignment.taskId);

    // Filter out tasks that are already assigned
    const tasksToAssign = generalTasks.filter(task => !existingTaskIds.includes(task.id));

    if (tasksToAssign.length === 0) {
      console.log('All general tasks are already assigned to this user');
      return 0;
    }

    // Create assignments for the new tasks
    const assignmentData = tasksToAssign.map(task => ({
      taskId: task.id,
      userId: userId,
    }));

    console.log(`Creating ${assignmentData.length} new task assignments:`, assignmentData);

    const assignments = await db.insert(taskAssignments).values(assignmentData).returning();
    
    console.log(`✅ Successfully assigned ${assignments.length} general tasks to user ${userId}`);
    
    // Log which clients the tasks were assigned for
    const clientNames = tasksToAssign.map(task => task.project.client.name).join(', ');
    console.log(`Tasks assigned for clients: ${clientNames}`);

    return assignments.length;
  } catch (error) {
    console.error('❌ Error assigning general tasks to user:', error);
    throw error;
  }
}
