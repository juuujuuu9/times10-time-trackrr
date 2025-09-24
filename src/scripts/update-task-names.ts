import 'dotenv/config';
import { db } from '../db/index';
import { tasks, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Update existing tasks to follow the new naming convention:
 * - "Time Tracking" projects → "General" task
 * - Other projects → task name = project name
 */

async function updateTaskNames() {
  console.log('=== UPDATING TASK NAMES TO NEW CONVENTION ===');
  
  // Get all active projects
  const activeProjects = await db.select().from(projects).where(eq(projects.archived, false));
  console.log(`Found ${activeProjects.length} active projects`);
  
  let updatedTasks = 0;
  
  for (const project of activeProjects) {
    console.log(`\\nProcessing project: "${project.name}" (ID: ${project.id})`);
    
    // Get all tasks for this project
    const projectTasks = await db.select().from(tasks).where(and(
      eq(tasks.projectId, project.id),
      eq(tasks.archived, false)
    ));
    
    console.log(`  Found ${projectTasks.length} tasks for this project`);
    
    for (const task of projectTasks) {
      const expectedTaskName = project.name === 'Time Tracking' ? 'General' : project.name;
      
      if (task.name !== expectedTaskName) {
        console.log(`  Updating task "${task.name}" → "${expectedTaskName}"`);
        
        await db.update(tasks).set({
          name: expectedTaskName,
          description: project.name === 'Time Tracking' 
            ? `General time tracking for ${project.name}` 
            : `Work on ${project.name}`
        }).where(eq(tasks.id, task.id));
        
        updatedTasks++;
      } else {
        console.log(`  Task "${task.name}" already correct`);
      }
    }
  }
  
  console.log(`\\n=== SUMMARY ===`);
  console.log(`Updated ${updatedTasks} tasks to follow new naming convention`);
  
  // Verify the results
  console.log('\\n=== VERIFICATION ===');
  for (const project of activeProjects) {
    const projectTasks = await db.select().from(tasks).where(and(
      eq(tasks.projectId, project.id),
      eq(tasks.archived, false)
    ));
    
    const expectedTaskName = project.name === 'Time Tracking' ? 'General' : project.name;
    const hasCorrectTask = projectTasks.some(t => t.name === expectedTaskName);
    
    console.log(`Project "${project.name}": ${hasCorrectTask ? '✅' : '❌'} (expected: "${expectedTaskName}")`);
  }
}

updateTaskNames().catch((e) => {
  console.error('Error updating task names:', e);
  process.exit(1);
});
