import 'dotenv/config';
import { db } from '../db/index';
import { 
  users, 
  clients, 
  projects, 
  tasks, 
  taskAssignments, 
  timeEntries 
} from '../db/schema';
import { hashPassword } from '../utils/auth';
import { eq } from 'drizzle-orm';

// Helper function to check if a date is a weekday (Monday-Friday)
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

// Helper function to get the next weekday
function getNextWeekday(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // If it's Saturday, go to Monday
  if (nextDate.getDay() === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  }
  // If it's Sunday, go to Monday
  else if (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

// Generate realistic work patterns with 8-hour total work days
function generateWorkPattern(): {
  startHour: number;
  endHour: number;
  breakDuration: number;
  lunchDuration: number;
} {
  const patterns = [
    // Early bird pattern (7 AM - 4 PM with breaks)
    { startHour: 7, endHour: 16, breakDuration: 15, lunchDuration: 45 },
    // Standard 9-5 pattern
    { startHour: 9, endHour: 18, breakDuration: 15, lunchDuration: 60 },
    // Late start pattern (10 AM - 7 PM)
    { startHour: 10, endHour: 19, breakDuration: 20, lunchDuration: 40 },
    // Flexible pattern (8 AM - 5 PM)
    { startHour: 8, endHour: 17, breakDuration: 10, lunchDuration: 30 },
    // Long lunch pattern (8 AM - 6 PM)
    { startHour: 8, endHour: 18, breakDuration: 15, lunchDuration: 45 }
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate realistic time entries for a single day (8 hours total with breaks)
function generateDayTimeEntries(
  date: Date,
  userId: number,
  taskIds: number[],
  workPattern: any
): any[] {
  const entries: any[] = [];
  const { startHour, endHour, breakDuration, lunchDuration } = workPattern;
  
  // Calculate total work hours (8 hours)
  const totalWorkHours = 8;
  const totalBreakMinutes = breakDuration + lunchDuration;
  const actualWorkHours = totalWorkHours - (totalBreakMinutes / 60);
  
  // Split work into 3-4 sessions
  const numSessions = Math.floor(Math.random() * 2) + 3; // 3-4 sessions
  const sessionDuration = actualWorkHours / numSessions;
  
  let currentHour = startHour;
  
  for (let session = 0; session < numSessions; session++) {
    // Add some variation to session duration (±15 minutes)
    const variation = (Math.random() - 0.5) * 0.5; // ±0.5 hours
    const actualSessionDuration = Math.max(0.5, sessionDuration + variation);
    
    const startTime = new Date(date);
    startTime.setHours(Math.floor(currentHour), (currentHour % 1) * 60, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + Math.floor(actualSessionDuration * 60));
    
    // Pick a random task
    const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
    
    // Generate realistic notes
    const notes = generateSessionNotes(session, actualSessionDuration);
    
    entries.push({
      taskId,
      userId,
      startTime,
      endTime,
      durationManual: Math.floor(actualSessionDuration * 3600), // Convert to seconds
      notes
    });
    
    // Move to next session time
    currentHour += actualSessionDuration;
    
    // Add break between sessions (except after last session)
    if (session < numSessions - 1) {
      const breakTime = session === 1 ? lunchDuration / 60 : breakDuration / 60; // Lunch after second session
      currentHour += breakTime;
    }
  }
  
  return entries;
}

// Generate realistic notes for work sessions
function generateSessionNotes(sessionIndex: number, duration: number): string {
  const morningTasks = [
    'Morning planning and task prioritization',
    'Client communication and email management',
    'Project research and requirements analysis',
    'Design concept development',
    'Code review and debugging',
    'Team standup and collaboration',
    'Creative brainstorming session',
    'Documentation and project setup',
    'Database optimization and maintenance',
    'API development and testing'
  ];
  
  const afternoonTasks = [
    'Design implementation and refinement',
    'Client feedback integration',
    'Quality assurance and testing',
    'Final production work',
    'Project documentation',
    'Team collaboration and reviews',
    'Creative asset development',
    'Performance optimization',
    'Bug fixes and troubleshooting',
    'Feature development and implementation'
  ];
  
  const longSessionTasks = [
    'Deep focus work on complex features',
    'Extended design iteration session',
    'Comprehensive code refactoring',
    'Detailed project planning and strategy',
    'Intensive problem-solving session',
    'Creative direction and concept development',
    'System architecture design',
    'Database schema optimization'
  ];
  
  const tasks = duration > 3 ? longSessionTasks : 
                sessionIndex < 2 ? morningTasks : afternoonTasks;
  
  return tasks[Math.floor(Math.random() * tasks.length)];
}

// Create team members with varying pay rates
async function createTeamMembers() {
  console.log('👥 Creating team members...');
  
  const teamMembers = [
    {
      email: 'sarah.johnson@times10.com',
      name: 'Sarah Johnson',
      password: 'password123',
      role: 'user',
      status: 'active',
      payRate: '45.00'
    },
    {
      email: 'michael.chen@times10.com',
      name: 'Michael Chen',
      password: 'password123',
      role: 'user',
      status: 'active',
      payRate: '38.00'
    },
    {
      email: 'emily.rodriguez@times10.com',
      name: 'Emily Rodriguez',
      password: 'password123',
      role: 'user',
      status: 'active',
      payRate: '42.00'
    },
    {
      email: 'david.kim@times10.com',
      name: 'David Kim',
      password: 'password123',
      role: 'user',
      status: 'active',
      payRate: '35.00'
    },
    {
      email: 'lisa.thompson@times10.com',
      name: 'Lisa Thompson',
      password: 'password123',
      role: 'user',
      status: 'active',
      payRate: '50.00'
    }
  ];

  const createdUsers: any[] = [];
  
  for (const userData of teamMembers) {
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email)
    });

    if (existingUser) {
      console.log(`User ${userData.email} already exists, updating...`);
      await db.update(users)
        .set({
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          status: userData.status,
          payRate: userData.payRate,
          updatedAt: new Date()
        })
        .where(eq(users.email, userData.email));
      createdUsers.push(existingUser);
    } else {
      console.log(`Creating user ${userData.email}...`);
      const [newUser] = await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
        payRate: userData.payRate
      }).returning();
      createdUsers.push(newUser);
    }
  }

  console.log(`✅ Created ${createdUsers.length} team members`);
  return createdUsers;
}

// Create clients
async function createClients(adminUserId: number) {
  console.log('🏢 Creating clients...');
  
  const clientData = [
    { name: 'TechCorp Solutions' },
    { name: 'Global Innovations Inc' },
    { name: 'Digital Dynamics LLC' },
    { name: 'Future Systems Ltd' }
  ];

  const createdClients: any[] = [];
  
  for (const client of clientData) {
    console.log(`Creating client: ${client.name}`);
    const [newClient] = await db.insert(clients).values({
      name: client.name,
      createdBy: adminUserId
    }).returning();
    createdClients.push(newClient);
  }

  console.log(`✅ Created ${createdClients.length} clients`);
  return createdClients;
}

// Create projects for each client
async function createProjects(clients: any[]) {
  console.log('📁 Creating projects...');
  
  const projectNames = [
    'Website Redesign',
    'Mobile App Development',
    'E-commerce Platform',
    'CRM System Implementation',
    'Data Analytics Dashboard',
    'API Integration',
    'Cloud Migration',
    'Security Audit'
  ];

  const createdProjects: any[] = [];
  
  for (const client of clients) {
    // Create 2 projects per client
    for (let i = 0; i < 2; i++) {
      const projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
      console.log(`Creating project: ${projectName} for ${client.name}`);
      
      const [newProject] = await db.insert(projects).values({
        name: projectName,
        clientId: client.id
      }).returning();
      createdProjects.push(newProject);
    }
  }

  console.log(`✅ Created ${createdProjects.length} projects`);
  return createdProjects;
}

// Create tasks for each project
async function createTasks(projects: any[]) {
  console.log('📋 Creating tasks...');
  
  const taskNames = [
    'Requirements Analysis',
    'Design Mockups',
    'Frontend Development',
    'Backend Development',
    'Database Design',
    'API Development',
    'Testing and QA',
    'Documentation',
    'Deployment Setup',
    'Performance Optimization',
    'Security Implementation',
    'User Training',
    'Bug Fixes',
    'Feature Enhancement',
    'Code Review',
    'Integration Testing'
  ];

  const createdTasks: any[] = [];
  
  for (const project of projects) {
    // Create 2 tasks per project
    for (let i = 0; i < 2; i++) {
      const taskName = taskNames[Math.floor(Math.random() * taskNames.length)];
      console.log(`Creating task: ${taskName} for project ${project.name}`);
      
      const [newTask] = await db.insert(tasks).values({
        name: taskName,
        projectId: project.id,
        description: `Task for ${project.name}: ${taskName}`,
        status: 'pending',
        priority: 'regular'
      }).returning();
      createdTasks.push(newTask);
    }
  }

  console.log(`✅ Created ${createdTasks.length} tasks`);
  return createdTasks;
}

// Assign tasks to team members randomly
async function assignTasksToTeamMembers(tasks: any[], teamMembers: any[]) {
  console.log('👥 Assigning tasks to team members...');
  
  const assignments: any[] = [];
  
  for (const task of tasks) {
    // Assign each task to 1-3 team members randomly
    const numAssignments = Math.floor(Math.random() * 3) + 1;
    const shuffledMembers = [...teamMembers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numAssignments; i++) {
      const member = shuffledMembers[i];
      console.log(`Assigning task ${task.name} to ${member.name}`);
      
      assignments.push({
        taskId: task.id,
        userId: member.id
      });
    }
  }

  // Insert assignments
  await db.insert(taskAssignments).values(assignments);
  console.log(`✅ Created ${assignments.length} task assignments`);
  return assignments;
}

// Generate time entries for 20 business days
async function generateTimeEntries(teamMembers: any[], tasks: any[]) {
  console.log('⏱️  Generating time entries for 20 business days...');
  
  const allTimeEntries: any[] = [];
  const startDate = new Date(); // Start from today
  let currentDate = new Date(startDate);
  let businessDayCount = 0;
  
  // Generate entries for 20 business days
  while (businessDayCount < 20) {
    if (isWeekday(currentDate)) {
      console.log(`Generating entries for ${currentDate.toDateString()} (Business day ${businessDayCount + 1})`);
      
      // Generate entries for each team member
      for (const member of teamMembers) {
        // Get tasks assigned to this member
        const memberAssignments = await db.select()
          .from(taskAssignments)
          .where(eq(taskAssignments.userId, member.id));
        
        const memberTaskIds = memberAssignments.map(a => a.taskId);
        
        // If no tasks assigned, use all tasks
        const taskIds = memberTaskIds.length > 0 ? memberTaskIds : tasks.map(t => t.id);
        
        // Generate work pattern for this member
        const workPattern = generateWorkPattern();
        
        // Generate day entries
        const dayEntries = generateDayTimeEntries(
          new Date(currentDate), 
          member.id, 
          taskIds, 
          workPattern
        );
        
        allTimeEntries.push(...dayEntries);
      }
      
      businessDayCount++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insert all time entries
  if (allTimeEntries.length > 0) {
    await db.insert(timeEntries).values(allTimeEntries);
    console.log(`✅ Generated ${allTimeEntries.length} time entries`);
  }
  
  return allTimeEntries;
}

// Main function to generate comprehensive data
async function generateComprehensiveData() {
  try {
    console.log('🚀 Starting comprehensive data generation...');
    
    // Get or create admin user for client creation
    let adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'admin')
    });
    
    if (!adminUser) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('admin123');
      const [newAdmin] = await db.insert(users).values({
        email: 'admin@times10.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        payRate: '50.00'
      }).returning();
      adminUser = newAdmin;
    }
    
    // Create team members
    const teamMembers = await createTeamMembers();
    
    // Create clients
    const clients = await createClients(adminUser.id);
    
    // Create projects
    const projects = await createProjects(clients);
    
    // Create tasks
    const tasks = await createTasks(projects);
    
    // Assign tasks to team members
    await assignTasksToTeamMembers(tasks, teamMembers);
    
    // Generate time entries
    const timeEntries = await generateTimeEntries(teamMembers, tasks);
    
    console.log('\n🎉 Comprehensive data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Created ${teamMembers.length} team members with pay rates $30-$50/hour`);
    console.log(`   - Created ${clients.length} clients`);
    console.log(`   - Created ${projects.length} projects (2 per client)`);
    console.log(`   - Created ${tasks.length} tasks (2 per project)`);
    console.log(`   - Generated ${timeEntries.length} time entries over 20 business days`);
    console.log(`   - Each team member works minimum 8 hours per business day with breaks`);
    
    console.log('\n👥 Team Members:');
    teamMembers.forEach(member => {
      console.log(`   - ${member.name} (${member.email}) - $${member.payRate}/hour`);
    });
    
    console.log('\n🏢 Clients and Projects:');
    for (const client of clients) {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      console.log(`   - ${client.name}:`);
      clientProjects.forEach(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        console.log(`     * ${project.name}: ${projectTasks.map(t => t.name).join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generating comprehensive data:', error);
    throw error;
  }
}

// Run the script
generateComprehensiveData()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
