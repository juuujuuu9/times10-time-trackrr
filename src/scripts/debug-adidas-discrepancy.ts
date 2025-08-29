import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../.env') });

import { db } from '../db';
import { timeEntries, users, tasks, projects, clients } from '../db/schema';
import { sql, eq, and } from 'drizzle-orm';

async function debugAdidasDiscrepancy() {
  console.log('=== DEBUGGING ADIDAS COST DISCREPANCY ===\n');

  // Find adidas client
  const adidasClient = await db
    .select()
    .from(clients)
    .where(eq(clients.name, 'adidas'))
    .limit(1);

  if (adidasClient.length === 0) {
    console.log('❌ No adidas client found');
    return;
  }

  const clientId = adidasClient[0].id;
  console.log(`✅ Found adidas client with ID: ${clientId}\n`);

  // Get all projects for adidas
  const adidasProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      archived: projects.archived
    })
    .from(projects)
    .where(eq(projects.clientId, clientId));

  console.log('📋 Adidas Projects:');
  adidasProjects.forEach(project => {
    console.log(`  - ${project.name} (ID: ${project.id}, Archived: ${project.archived})`);
  });
  console.log('');

  // Get all time entries for adidas projects
  const adidasTimeEntries = await db
    .select({
      id: timeEntries.id,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      durationManual: timeEntries.durationManual,
      notes: timeEntries.notes,
      createdAt: timeEntries.createdAt,
      userName: users.name,
      userPayRate: users.payRate,
      taskName: tasks.name,
      projectName: projects.name,
      clientName: clients.name,
      calculatedDuration: sql<number>`CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
        ELSE COALESCE(${timeEntries.durationManual}, 0)
      END`.as('calculated_duration'),
      calculatedCost: sql<number>`CASE 
        WHEN ${timeEntries.endTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0)
        ELSE COALESCE(${timeEntries.durationManual}, 0) / 3600 * COALESCE(${users.payRate}, 0)
      END`.as('calculated_cost')
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(clients.id, clientId))
    .orderBy(timeEntries.createdAt);

  console.log(`📊 Found ${adidasTimeEntries.length} time entries for adidas:\n`);

  adidasTimeEntries.forEach((entry, index) => {
    console.log(`Entry ${index + 1}:`);
    console.log(`  ID: ${entry.id}`);
    console.log(`  User: ${entry.userName} (Pay Rate: $${entry.userPayRate || 0}/hr)`);
    console.log(`  Project: ${entry.projectName}`);
    console.log(`  Task: ${entry.taskName}`);
    console.log(`  Start Time: ${entry.startTime}`);
    console.log(`  End Time: ${entry.endTime}`);
    console.log(`  Duration Manual: ${entry.durationManual} seconds`);
    console.log(`  Calculated Duration: ${entry.calculatedDuration} seconds (${(entry.calculatedDuration / 3600).toFixed(2)} hours)`);
    console.log(`  Calculated Cost: $${Number(entry.calculatedCost || 0).toFixed(2)}`);
    console.log(`  Created At: ${entry.createdAt}`);
    console.log(`  Notes: ${entry.notes || 'None'}`);
    console.log('');
  });

  // Calculate totals
  const totalDuration = adidasTimeEntries.reduce((sum, entry) => sum + entry.calculatedDuration, 0);
  const totalCost = adidasTimeEntries.reduce((sum, entry) => sum + Number(entry.calculatedCost || 0), 0);

  console.log('📈 TOTALS:');
  console.log(`  Total Duration: ${totalDuration} seconds (${(totalDuration / 3600).toFixed(2)} hours)`);
  console.log(`  Total Cost: $${totalCost.toFixed(2)}`);
  console.log('');

  // Check for any entries with non-zero cost but zero duration
  const problematicEntries = adidasTimeEntries.filter(entry => 
    Number(entry.calculatedCost || 0) > 0 && entry.calculatedDuration === 0
  );

  if (problematicEntries.length > 0) {
    console.log('⚠️  PROBLEMATIC ENTRIES (Cost > 0 but Duration = 0):');
    problematicEntries.forEach(entry => {
      console.log(`  - Entry ID ${entry.id}: Cost $${Number(entry.calculatedCost || 0).toFixed(2)}, Duration ${entry.calculatedDuration}s`);
    });
  } else {
    console.log('✅ No problematic entries found');
  }

  // Check for entries with zero cost but non-zero duration
  const zeroCostEntries = adidasTimeEntries.filter(entry => 
    Number(entry.calculatedCost || 0) === 0 && entry.calculatedDuration > 0
  );

  if (zeroCostEntries.length > 0) {
    console.log('\n⚠️  ENTRIES WITH ZERO COST BUT NON-ZERO DURATION:');
    zeroCostEntries.forEach(entry => {
      console.log(`  - Entry ID ${entry.id}: Cost $${Number(entry.calculatedCost || 0).toFixed(2)}, Duration ${entry.calculatedDuration}s, Pay Rate $${entry.userPayRate || 0}`);
    });
  }

  console.log('\n=== END DEBUG ===');
}

// Run the debug function
debugAdidasDiscrepancy()
  .then(() => {
    console.log('Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
