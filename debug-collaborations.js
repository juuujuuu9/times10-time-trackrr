import { neon } from '@neondatabase/serverless';

async function debugCollaborations() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const sql = neon(databaseUrl);
    console.log('=== DEBUGGING COLLABORATIONS ===');
    
    // Check all projects
    console.log('\n1. All Projects:');
    const allProjects = await sql`
      SELECT id, name, client_id, archived 
      FROM projects 
      ORDER BY name
    `;
    console.log('Total projects:', allProjects.length);
    allProjects.forEach(p => {
      console.log(`- Project ${p.id}: "${p.name}" (Client ID: ${p.client_id}, Archived: ${p.archived})`);
    });
    
    // Check all teams/collaborations
    console.log('\n2. All Teams/Collaborations:');
    const allTeams = await sql`
      SELECT id, name, created_by, archived 
      FROM teams 
      ORDER BY name
    `;
    console.log('Total teams:', allTeams.length);
    allTeams.forEach(t => {
      console.log(`- Team ${t.id}: "${t.name}" (Created by: ${t.created_by}, Archived: ${t.archived})`);
    });
    
    // Check project-team assignments
    console.log('\n3. Project-Team Assignments:');
    const assignments = await sql`
      SELECT pt.project_id, pt.team_id, pt.assigned_by, pt.assigned_at,
             p.name as project_name, t.name as team_name
      FROM project_teams pt
      LEFT JOIN projects p ON pt.project_id = p.id
      LEFT JOIN teams t ON pt.team_id = t.id
      ORDER BY pt.project_id
    `;
    console.log('Total assignments:', assignments.length);
    assignments.forEach(a => {
      console.log(`- Project ${a.project_id} ("${a.project_name}") -> Team ${a.team_id} ("${a.team_name}") (Assigned by: ${a.assigned_by})`);
    });
    
    // Check the specific query we're using
    console.log('\n4. Projects with Collaboration Data (using our query):');
    const projectsWithCollab = await sql`
      SELECT p.id, p.name, p.client_id, c.name as client_name, 
             pt.team_id as collaboration_id, t.name as collaboration_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_teams pt ON p.id = pt.project_id
      LEFT JOIN teams t ON pt.team_id = t.id
      WHERE c.archived = false
      ORDER BY c.name, p.name
    `;
    
    console.log('Projects with collaboration data:', projectsWithCollab.length);
    projectsWithCollab.forEach(p => {
      console.log(`- Project ${p.id}: "${p.name}" (Client: ${p.client_name}) | Collaboration: ${p.collaboration_id ? `ID ${p.collaboration_id} - "${p.collaboration_name}"` : 'None'}`);
    });
    
    // Look for NIL Summit specifically
    console.log('\n5. Looking for NIL Summit:');
    const nilSummit = projectsWithCollab.filter(p => 
      p.name.toLowerCase().includes('nil') || p.name.toLowerCase().includes('summit')
    );
    console.log('NIL Summit projects found:', nilSummit.length);
    nilSummit.forEach(p => {
      console.log(`- Found: "${p.name}" | Collaboration: ${p.collaboration_id ? `ID ${p.collaboration_id} - "${p.collaboration_name}"` : 'None'}`);
    });
    
  } catch (error) {
    console.error('Error debugging collaborations:', error);
  }
}

debugCollaborations();
