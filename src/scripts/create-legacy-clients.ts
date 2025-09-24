import { db } from '../db';
import { clients, projects, tasks, taskAssignments, users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function createLegacyClients() {
  try {
    console.log('Creating legacy clients with old naming convention...');

    // Get the admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@test.com')
    });

    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    // Create clients using old naming convention
    const legacyClients = [
      { name: 'FLERISH', description: 'Flerish client with old structure' },
      { name: 'ADIDAS', description: 'Adidas client with old structure' },
      { name: 'NIKE', description: 'Nike client with old structure' },
      { name: 'APPLE', description: 'Apple client with old structure' }
    ];

    for (const clientData of legacyClients) {
      console.log(`Creating client: ${clientData.name}`);
      
      // Create client
      const [client] = await db.insert(clients).values({
        name: clientData.name,
        createdBy: adminUser.id,
        archived: false
      }).returning();

      console.log(`Created client ${client.name} with ID: ${client.id}`);

      // Create the old "Time Tracking" project for this client
      const [project] = await db.insert(projects).values({
        clientId: client.id,
        name: 'Time Tracking',
        archived: false,
        isSystem: false
      }).returning();

      console.log(`Created project "Time Tracking" for ${client.name} with ID: ${project.id}`);

      // Create the "General" task for this project (old structure)
      const [task] = await db.insert(tasks).values({
        projectId: project.id,
        name: 'General',
        description: `General task for ${client.name}`,
        status: 'active',
        priority: 'regular',
        archived: false,
        isSystem: false
      }).returning();

      console.log(`Created "General" task for ${client.name} with ID: ${task.id}`);

      // Assign the task to the admin user
      await db.insert(taskAssignments).values({
        taskId: task.id,
        userId: adminUser.id
      });

      console.log(`Assigned General task to admin user for ${client.name}`);
    }

    console.log('Legacy clients created successfully!');
    console.log('\nLegacy Structure Created:');
    console.log('- Each client has a "Time Tracking" project');
    console.log('- Each project has a "General" task');
    console.log('- Tasks are assigned to admin user');
    console.log('\nThis matches the old naming convention where:');
    console.log('- Client names are in ALL CAPS');
    console.log('- All projects are called "Time Tracking"');
    console.log('- All tasks are called "General"');

  } catch (error) {
    console.error('Error creating legacy clients:', error);
  } finally {
    process.exit(0);
  }
}

createLegacyClients();
