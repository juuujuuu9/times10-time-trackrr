import 'dotenv/config';
import { db } from '../db/index';
import { clients, projects, tasks, timeEntries, users, taskAssignments } from '../db/schema';
import { and, eq, like } from 'drizzle-orm';

type MigrationOptions = {
  execute: boolean;
  delimiter: string;
};

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  return {
    execute: args.includes('--execute'),
    delimiter: (args.find(a => a.startsWith('--delimiter='))?.split('=')[1] || ' - ').trim(),
  };
}

function splitClientName(name: string, delimiter: string): { brand: string; project: string } | null {
  const parts = name.split(delimiter);
  if (parts.length !== 2) return null;
  const brand = parts[0].trim();
  const project = parts[1].trim();
  if (!brand || !project) return null;
  return { brand, project };
}

async function ensureClient(brandName: string) {
  const existing = await db.select().from(clients).where(eq(clients.name, brandName));
  if (existing.length > 0) return existing[0];
  const created = await db.insert(clients).values({ name: brandName, createdBy: 1 }).returning();
  return created[0];
}

async function ensureProject(clientId: number, projectName: string) {
  const existing = await db.select().from(projects).where(and(eq(projects.clientId, clientId), eq(projects.name, projectName)));
  if (existing.length > 0) return existing[0];
  const created = await db.insert(projects).values({ clientId, name: projectName }).returning();
  return created[0];
}

async function ensureGeneralTask(projectId: number) {
  const existing = await db.select().from(tasks).where(and(eq(tasks.projectId, projectId), eq(tasks.name, 'General')));
  if (existing.length > 0) return existing[0];
  const created = await db.insert(tasks).values({ projectId, name: 'General', isSystem: true }).returning();
  return created[0];
}

async function assignGeneralToActiveUsers(taskId: number) {
  const active = await db.select().from(users).where(eq(users.status, 'active'));
  if (active.length === 0) return;
  const rows = active.map(u => ({ taskId, userId: u.id }));
  try { await db.insert(taskAssignments).values(rows); } catch {}
}

async function cleanupMigration() {
  try {
    console.log('Cleaning up migration issues...');

    // Find any remaining clients with hyphenated names that should be cleaned up
    const problematicClients = await db.select().from(clients).where(like(clients.name, '% - %'));
    
    for (const problematicClient of problematicClients) {
      console.log(`Found problematic client: ${problematicClient.name} (ID: ${problematicClient.id})`);
      
      // Get all projects under this client
      const clientProjects = await db.select().from(projects).where(eq(projects.clientId, problematicClient.id));
      console.log(`Found ${clientProjects.length} projects under this client`);

      // Try to find the corresponding new client
      const parsed = splitClientName(problematicClient.name, ' - ');
      if (!parsed) continue;
      
      const { brand } = parsed;
      const newClient = await db.select().from(clients).where(eq(clients.name, brand)).limit(1);
      
      if (newClient.length === 0) {
        console.log(`No corresponding new client found for brand "${brand}", skipping`);
        continue;
      }

      console.log(`Found corresponding new client: ${newClient[0].name} (ID: ${newClient[0].id})`);

      // Move all projects to the new client
      for (const project of clientProjects) {
        console.log(`Moving project "${project.name}" to new ${brand} client`);
        
        await db.update(projects)
          .set({ clientId: newClient[0].id })
          .where(eq(projects.id, project.id));
          
        console.log(`Project "${project.name}" moved successfully`);
      }

      // Delete the old problematic client
      console.log(`Deleting old problematic client: ${problematicClient.name}`);
      await db.delete(clients).where(eq(clients.id, problematicClient.id));
      console.log('Old client deleted successfully');
    }

    console.log('Cleanup completed successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

async function run() {
  const { execute, delimiter } = parseArgs();

  console.log(`Split-clients migration starting. execute=${execute} delimiter="${delimiter}"`);

  // Find candidate clients that look like "Brand - Project"
  const candidates = await db.select().from(clients).where(like(clients.name, `%${delimiter.trim()}%`));
  if (candidates.length === 0) {
    console.log('No candidate clients found.');
    return;
  }

  let movedTimeEntries = 0;
  const actions: string[] = [];

  for (const candidate of candidates) {
    const parsed = splitClientName(candidate.name, delimiter);
    if (!parsed) continue;
    const { brand, project } = parsed;

    actions.push(`Candidate: Client#${candidate.id} "${candidate.name}" → brand="${brand}" project="${project}"`);

    // Ensure canonical client and project
    const targetClient = execute ? await ensureClient(brand) : { id: -1, name: brand } as any;
    const targetClientId = execute ? targetClient.id : -1;
    const targetProject = execute ? await ensureProject(targetClientId, project) : { id: -1, name: project } as any;
    const generalTask = execute ? await ensureGeneralTask(targetProject.id) : { id: -1 } as any;

    if (execute) {
      await assignGeneralToActiveUsers(generalTask.id);
    }

    // Locate time entries on the candidate client's tasks
    // 1) find projects under candidate
    const candidateProjects = await db.select().from(projects).where(eq(projects.clientId, candidate.id));
    for (const p of candidateProjects) {
      // 2) find tasks under project
      const pTasks = await db.select().from(tasks).where(eq(tasks.projectId, p.id));
      for (const t of pTasks) {
        // 3) re-point time entries to generalTask
        const entries = await db.select().from(timeEntries).where(eq(timeEntries.taskId, t.id));
        if (entries.length === 0) continue;
        actions.push(`  Will move ${entries.length} time entries from Task#${t.id} -> General of "${brand}/${project}"`);
        if (execute) {
          await db.update(timeEntries).set({ taskId: generalTask.id }).where(eq(timeEntries.taskId, t.id));
        }
        movedTimeEntries += entries.length;
      }
    }

    // Archive the old split client (non-destructive)
    actions.push(`  Archive Client#${candidate.id} "${candidate.name}"`);
    if (execute) {
      await db.update(clients).set({ archived: true }).where(eq(clients.id, candidate.id));
    }
  }

  console.log('Planned actions:');
  for (const a of actions) console.log(a);
  console.log(`Total time entries ${execute ? 'moved' : 'to move'}: ${movedTimeEntries}`);
  
  if (execute) {
    console.log('Migration completed successfully.');
    
    // Now run cleanup to handle any remaining issues
    console.log('\nRunning cleanup...');
    await cleanupMigration();
  } else {
    console.log('Done. Run with --execute to apply changes.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


