/**
 * Query production database for total time entries for "adidas rugby" project
 */

import { neon } from '@neondatabase/serverless';

// Production database URL
const PROD_DB_URL = 'postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';

async function queryAdidasRugbyTime() {
  const sql = neon(PROD_DB_URL);

  try {
    console.log('🔍 Connecting to production database...\n');

    // First, find the project(s) matching "adidas rugby" (case-insensitive)
    console.log('📋 Searching for "adidas rugby" project(s)...');
    const projects = await sql`
      SELECT id, name, client_id
      FROM projects
      WHERE LOWER(name) LIKE '%adidas%rugby%' OR LOWER(name) LIKE '%rugby%adidas%'
      ORDER BY name
    `;

    if (projects.length === 0) {
      console.log('❌ No projects found matching "adidas rugby"');
      console.log('\n🔍 Searching for projects with "adidas" in the name...');
      const adidasProjects = await sql`
        SELECT id, name, client_id
        FROM projects
        WHERE LOWER(name) LIKE '%adidas%'
        ORDER BY name
      `;
      
      if (adidasProjects.length > 0) {
        console.log('Found projects with "adidas":');
        adidasProjects.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}`);
        });
        // Add adidas projects to the list
        projects.push(...adidasProjects);
      }
      
      console.log('\n🔍 Searching for projects with "rugby" in the name...');
      const rugbyProjects = await sql`
        SELECT id, name, client_id
        FROM projects
        WHERE LOWER(name) LIKE '%rugby%'
        ORDER BY name
      `;
      
      if (rugbyProjects.length > 0) {
        console.log('Found projects with "rugby":');
        rugbyProjects.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}`);
        });
        // Add rugby projects to the list (avoid duplicates)
        rugbyProjects.forEach(rp => {
          if (!projects.find(p => p.id === rp.id)) {
            projects.push(rp);
          }
        });
      }
      
      if (projects.length === 0) {
        console.log('\n❌ No matching projects found. Exiting.');
        return;
      }
      
      console.log(`\n✅ Found ${projects.length} project(s) to analyze:\n`);
      projects.forEach(p => {
        console.log(`  - ID: ${p.id}, Name: ${p.name}`);
      });
      console.log('');
    } else {
      console.log(`✅ Found ${projects.length} project(s):\n`);
      projects.forEach(p => {
        console.log(`  - ID: ${p.id}, Name: ${p.name}`);
      });
      console.log('');
    }

    let grandTotalSeconds = 0;
    let grandTotalEntries = 0;
    let grandTotalCost = 0;

    // For each project, calculate total time and cost
    for (const project of projects) {
      console.log(`\n📊 Calculating time entries for project: "${project.name}" (ID: ${project.id})`);
      
      // Query summary statistics for this project
      // Calculate total duration using SQL for efficiency
      const summary = await sql`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN duration_manual IS NOT NULL THEN 1 END) as manual_entries,
          COUNT(CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN 1 END) as timer_entries,
          COUNT(CASE WHEN duration_manual IS NULL AND (start_time IS NULL OR end_time IS NULL) THEN 1 END) as incomplete_entries,
          COALESCE(SUM(duration_manual), 0) as manual_total_seconds,
          COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) as timer_total_seconds
        FROM time_entries
        WHERE project_id = ${project.id}
      `;

      const stats = summary[0];
      const totalSeconds = parseFloat(stats.manual_total_seconds || 0) + parseFloat(stats.timer_total_seconds || 0);
      
      // Add to grand total
      grandTotalSeconds += totalSeconds;
      grandTotalEntries += parseInt(stats.total_entries);
      
      console.log(`   Found ${stats.total_entries} time entry/entries\n`);
      console.log(`   Timer entries: ${stats.timer_entries}`);
      console.log(`   Manual entries: ${stats.manual_entries}`);
      if (parseInt(stats.incomplete_entries) > 0) {
        console.log(`   ⚠️  Incomplete entries: ${stats.incomplete_entries}`);
      }

      // Convert total seconds to readable format
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const totalHours = (totalSeconds / 3600).toFixed(2);

      console.log('   📈 Time Summary:');
      console.log(`      Total seconds: ${totalSeconds.toFixed(2)}`);
      console.log(`      Total hours: ${totalHours}`);
      console.log(`      Formatted: ${hours}h ${minutes}m ${seconds}s`);

      // Calculate cost by user
      console.log('\n   💰 Calculating costs by user...');
      
      // Query time entries with user pay rates
      // Calculate cost: (hours * pay_rate) for each entry
      const costQuery = await sql`
        SELECT 
          te.id,
          te.user_id,
          u.name as user_name,
          u.email as user_email,
          COALESCE(u.pay_rate, 0) as pay_rate,
          CASE 
            WHEN te.duration_manual IS NOT NULL THEN te.duration_manual / 3600.0
            WHEN te.start_time IS NOT NULL AND te.end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (te.end_time - te.start_time)) / 3600.0
            ELSE 0
          END as hours,
          CASE 
            WHEN te.duration_manual IS NOT NULL THEN te.duration_manual
            WHEN te.start_time IS NOT NULL AND te.end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (te.end_time - te.start_time))
            ELSE 0
          END as seconds
        FROM time_entries te
        JOIN users u ON te.user_id = u.id
        WHERE te.project_id = ${project.id}
        ORDER BY u.name, te.created_at
      `;

      let projectTotalCost = 0;
      const userCosts = {};

      for (const entry of costQuery) {
        const hours = parseFloat(entry.hours || 0);
        const payRate = parseFloat(entry.pay_rate || 0);
        const cost = hours * payRate;
        
        projectTotalCost += cost;

        // Group by user for summary
        const userId = entry.user_id;
        if (!userCosts[userId]) {
          userCosts[userId] = {
            name: entry.user_name,
            email: entry.user_email,
            payRate: payRate,
            hours: 0,
            cost: 0,
            entries: 0
          };
        }
        userCosts[userId].hours += hours;
        userCosts[userId].cost += cost;
        userCosts[userId].entries += 1;
      }

      // Display cost breakdown by user
      console.log('\n   📊 Cost Breakdown by User:');
      for (const userId in userCosts) {
        const user = userCosts[userId];
        const userHours = user.hours.toFixed(2);
        const userCost = user.cost.toFixed(2);
        console.log(`      ${user.name} ($${user.payRate.toFixed(2)}/hr): ${userHours}h × $${user.payRate.toFixed(2)} = $${userCost} (${user.entries} entries)`);
      }

      console.log(`\n   💵 Total Project Cost: $${projectTotalCost.toFixed(2)}`);
      grandTotalCost += projectTotalCost;
    }

    // Display grand total if multiple projects
    if (projects.length > 1) {
      console.log('\n\n🎯 GRAND TOTAL ACROSS ALL MATCHING PROJECTS:');
      const grandHours = Math.floor(grandTotalSeconds / 3600);
      const grandMinutes = Math.floor((grandTotalSeconds % 3600) / 60);
      const grandSeconds = Math.floor(grandTotalSeconds % 60);
      const grandTotalHours = (grandTotalSeconds / 3600).toFixed(2);

      console.log(`   Total entries: ${grandTotalEntries}`);
      console.log(`   Total seconds: ${grandTotalSeconds.toFixed(2)}`);
      console.log(`   Total hours: ${grandTotalHours}`);
      console.log(`   Formatted: ${grandHours}h ${grandMinutes}m ${grandSeconds}s`);
      console.log(`   💵 Total Cost: $${grandTotalCost.toFixed(2)}`);
    } else if (projects.length === 1) {
      // If only one project, show it as the final result
      console.log('\n\n🎯 FINAL RESULT:');
      const finalHours = Math.floor(grandTotalSeconds / 3600);
      const finalMinutes = Math.floor((grandTotalSeconds % 3600) / 60);
      const finalSeconds = Math.floor(grandTotalSeconds % 60);
      const finalTotalHours = (grandTotalSeconds / 3600).toFixed(2);

      console.log(`   Project: "${projects[0].name}"`);
      console.log(`   Total entries: ${grandTotalEntries}`);
      console.log(`   Total seconds: ${grandTotalSeconds.toFixed(2)}`);
      console.log(`   Total hours: ${finalTotalHours}`);
      console.log(`   Formatted: ${finalHours}h ${finalMinutes}m ${finalSeconds}s`);
      console.log(`   💵 Total Cost: $${grandTotalCost.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  }
}

// Run the query
queryAdidasRugbyTime()
  .then(() => {
    console.log('\n✅ Query completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Query failed:', error);
    process.exit(1);
  });

