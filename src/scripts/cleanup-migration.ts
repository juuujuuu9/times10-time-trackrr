import { db } from '../db';
import { clients, projects, tasks, timeEntries, taskAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function cleanupMigration() {
  try {
    console.log('Cleaning up migration issues...');

    // Find the problematic "Adidas - D. Rose" client (should be archived)
    const problematicClient = await db.query.clients.findFirst({
      where: eq(clients.name, 'Adidas - D. Rose')
    });

    if (problematicClient) {
      console.log(`Found problematic client: ${problematicClient.name} (ID: ${problematicClient.id})`);
      
      // Get all projects under this client
      const clientProjects = await db.query.projects.findMany({
        where: eq(projects.clientId, problematicClient.id)
      });

      console.log(`Found ${clientProjects.length} projects under this client:`);
      clientProjects.forEach(project => {
        console.log(`- Project: ${project.name} (ID: ${project.id})`);
      });

      // Get the new "Adidas" client
      const newAdidasClient = await db.query.clients.findFirst({
        where: eq(clients.name, 'Adidas')
      });

      if (!newAdidasClient) {
        console.log('New Adidas client not found, skipping migration');
        return;
      }

      console.log(`Found new Adidas client (ID: ${newAdidasClient.id})`);

      // For each project under the old client, move it to the new Adidas client
      for (const project of clientProjects) {
        console.log(`Moving project "${project.name}" to new Adidas client`);
        
        // Update the project's client_id
        await db.update(projects)
          .set({ clientId: newAdidasClient.id })
          .where(eq(projects.id, project.id));
          
        console.log(`Project "${project.name}" moved successfully`);

        // Also move all tasks from this project
        const projectTasks = await db.query.tasks.findMany({
          where: eq(tasks.projectId, project.id)
        });

        console.log(`Found ${projectTasks.length} tasks in project "${project.name}"`);
        
        // Tasks will automatically be associated with the new client through the project
        // No need to update task assignments as they're linked to the project
      }

      // Now that all projects are moved, we can safely delete the old client
      console.log(`Deleting old problematic client: ${problematicClient.name}`);
      await db.delete(clients).where(eq(clients.id, problematicClient.id));
      console.log('Old client deleted successfully');
    }

    // Let's also check for any other clients with hyphenated names that might need splitting
    const allClients = await db.query.clients.findMany();
    const hyphenatedClients = allClients.filter(client => 
      client.name.includes(' - ') && !client.archived
    );

    if (hyphenatedClients.length > 0) {
      console.log(`Found ${hyphenatedClients.length} clients with hyphenated names that might need splitting:`);
      hyphenatedClients.forEach(client => {
        console.log(`- ${client.name} (ID: ${client.id})`);
      });
    }

    console.log('Cleanup completed successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanupMigration();
