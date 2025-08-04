import 'dotenv/config';
import { db } from '../db/index';
import { users, clients, projects, tasks, taskAssignments, timeEntries } from '../db/schema';
import { eq } from 'drizzle-orm';

// Clear all existing data
async function clearAllData() {
  console.log('🗑️  Clearing all existing data...');
  
  // Clear in reverse order due to foreign key constraints
  await db.delete(timeEntries);
  await db.delete(taskAssignments);
  await db.delete(tasks);
  await db.delete(projects);
  await db.delete(clients);
  await db.delete(users);
  
  console.log('✅ All data cleared successfully');
}

// Generate 25 users for creative agency
async function generateUsers() {
  console.log('👥 Generating 25 users for creative agency...');
  
  const userData = [
    // Leadership Team
    {
      email: 'alex.morgan@creativeagency.com',
      name: 'Alex Morgan',
      role: 'admin',
      status: 'active',
      payRate: '120.00'
    },
    {
      email: 'sarah.chen@creativeagency.com',
      name: 'Sarah Chen',
      role: 'admin',
      status: 'active',
      payRate: '110.00'
    },
    
    // Creative Directors
    {
      email: 'marcus.rodriguez@creativeagency.com',
      name: 'Marcus Rodriguez',
      role: 'user',
      status: 'active',
      payRate: '95.00'
    },
    {
      email: 'jessica.kim@creativeagency.com',
      name: 'Jessica Kim',
      role: 'user',
      status: 'active',
      payRate: '92.00'
    },
    {
      email: 'david.thompson@creativeagency.com',
      name: 'David Thompson',
      role: 'user',
      status: 'active',
      payRate: '88.00'
    },
    
    // Senior Designers
    {
      email: 'emma.wilson@creativeagency.com',
      name: 'Emma Wilson',
      role: 'user',
      status: 'active',
      payRate: '75.00'
    },
    {
      email: 'michael.brown@creativeagency.com',
      name: 'Michael Brown',
      role: 'user',
      status: 'active',
      payRate: '72.00'
    },
    {
      email: 'lisa.garcia@creativeagency.com',
      name: 'Lisa Garcia',
      role: 'user',
      status: 'active',
      payRate: '70.00'
    },
    {
      email: 'james.lee@creativeagency.com',
      name: 'James Lee',
      role: 'user',
      status: 'active',
      payRate: '68.00'
    },
    
    // Copywriters
    {
      email: 'rachel.adams@creativeagency.com',
      name: 'Rachel Adams',
      role: 'user',
      status: 'active',
      payRate: '65.00'
    },
    {
      email: 'chris.martinez@creativeagency.com',
      name: 'Chris Martinez',
      role: 'user',
      status: 'active',
      payRate: '62.00'
    },
    {
      email: 'amanda.white@creativeagency.com',
      name: 'Amanda White',
      role: 'user',
      status: 'active',
      payRate: '60.00'
    },
    
    // Digital Designers
    {
      email: 'tyler.johnson@creativeagency.com',
      name: 'Tyler Johnson',
      role: 'user',
      status: 'active',
      payRate: '58.00'
    },
    {
      email: 'sophia.davis@creativeagency.com',
      name: 'Sophia Davis',
      role: 'user',
      status: 'active',
      payRate: '55.00'
    },
    {
      email: 'kevin.miller@creativeagency.com',
      name: 'Kevin Miller',
      role: 'user',
      status: 'active',
      payRate: '52.00'
    },
    
    // Social Media Specialists
    {
      email: 'hannah.clark@creativeagency.com',
      name: 'Hannah Clark',
      role: 'user',
      status: 'active',
      payRate: '50.00'
    },
    {
      email: 'brandon.lewis@creativeagency.com',
      name: 'Brandon Lewis',
      role: 'user',
      status: 'active',
      payRate: '48.00'
    },
    {
      email: 'ashley.hall@creativeagency.com',
      name: 'Ashley Hall',
      role: 'user',
      status: 'active',
      payRate: '45.00'
    },
    
    // Junior Designers
    {
      email: 'ryan.allen@creativeagency.com',
      name: 'Ryan Allen',
      role: 'user',
      status: 'active',
      payRate: '42.00'
    },
    {
      email: 'lauren.young@creativeagency.com',
      name: 'Lauren Young',
      role: 'user',
      status: 'active',
      payRate: '40.00'
    },
    {
      email: 'jordan.king@creativeagency.com',
      name: 'Jordan King',
      role: 'user',
      status: 'active',
      payRate: '38.00'
    },
    
    // Marketing Coordinators
    {
      email: 'taylor.wright@creativeagency.com',
      name: 'Taylor Wright',
      role: 'user',
      status: 'active',
      payRate: '35.00'
    },
    {
      email: 'morgan.green@creativeagency.com',
      name: 'Morgan Green',
      role: 'user',
      status: 'active',
      payRate: '32.00'
    },
    
    // Inactive/Former Employee
    {
      email: 'daniel.baker@creativeagency.com',
      name: 'Daniel Baker',
      role: 'user',
      status: 'inactive',
      payRate: '30.00'
    }
  ];

  const insertedUsers = await db.insert(users).values(userData).returning();
  console.log(`✅ Generated ${insertedUsers.length} users`);
  return insertedUsers;
}

// Generate generic clients
async function generateClients(adminUser: any) {
  console.log('🏢 Generating generic clients...');
  
  const clientData = [
    {
      name: 'TechStart Inc.',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Global Retail Solutions',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'HealthCare Plus',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'EcoFriendly Products',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Financial Services Group',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Food & Beverage Co.',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Education First',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Manufacturing Corp',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Real Estate Partners',
      createdBy: adminUser.id,
      archived: false
    },
    {
      name: 'Legacy Systems Ltd.',
      createdBy: adminUser.id,
      archived: true
    }
  ];

  const insertedClients = await db.insert(clients).values(clientData).returning();
  console.log(`✅ Generated ${insertedClients.length} clients`);
  return insertedClients;
}

// Generate projects for each client
async function generateProjects(clientsList: any[]) {
  console.log('📋 Generating projects for each client...');
  
  const projectData: any[] = [];
  
  clientsList.forEach((client, clientIndex) => {
    // Each client gets 2-4 projects
    const numProjects = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numProjects; i++) {
      const projectTypes = [
        'Brand Identity Design',
        'Website Redesign',
        'Marketing Campaign',
        'Social Media Strategy',
        'Print Collateral',
        'Digital Advertising',
        'Content Creation',
        'Logo Design',
        'Packaging Design',
        'Event Branding'
      ];
      
      const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const projectName = `${client.name} - ${projectType}`;
      
      projectData.push({
        clientId: client.id,
        name: projectName,
        archived: client.archived || Math.random() < 0.1 // 10% chance of archived
      });
    }
  });

  const insertedProjects = await db.insert(projects).values(projectData).returning();
  console.log(`✅ Generated ${insertedProjects.length} projects`);
  return insertedProjects;
}

// Generate tasks for each project
async function generateTasks(projectsList: any[]) {
  console.log('📝 Generating tasks for each project...');
  
  const taskData: any[] = [];
  
  projectsList.forEach((project) => {
    // Each project gets 3-8 tasks
    const numTasks = Math.floor(Math.random() * 6) + 3;
    
    const taskTypes = [
      'Research & Discovery',
      'Concept Development',
      'Design Creation',
      'Client Review',
      'Revisions',
      'Final Production',
      'Quality Assurance',
      'Client Presentation',
      'Implementation',
      'Launch Preparation'
    ];
    
    for (let i = 0; i < numTasks; i++) {
      const taskType = taskTypes[i % taskTypes.length];
      const statuses = ['completed', 'in_progress', 'pending'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      taskData.push({
        projectId: project.id,
        name: `${taskType}`,
        description: `${taskType} for ${project.name}`,
        status: status,
        archived: project.archived || Math.random() < 0.05 // 5% chance of archived
      });
    }
  });

  const insertedTasks = await db.insert(tasks).values(taskData).returning();
  console.log(`✅ Generated ${insertedTasks.length} tasks`);
  return insertedTasks;
}

// Generate task assignments - ensure each task has at least one team member
async function generateTaskAssignments(tasksList: any[], usersList: any[]) {
  console.log('👤 Generating task assignments...');
  
  const assignmentData: { taskId: number; userId: number }[] = [];
  const activeUsers = usersList.filter(user => user.status === 'active');
  
  tasksList.forEach((task) => {
    // Each task gets 1-4 team members
    const numAssignees = Math.floor(Math.random() * 4) + 1;
    const shuffledUsers = [...activeUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numAssignees && i < shuffledUsers.length; i++) {
      assignmentData.push({
        taskId: task.id,
        userId: shuffledUsers[i].id
      });
    }
  });

  if (assignmentData.length > 0) {
    await db.insert(taskAssignments).values(assignmentData);
    console.log(`✅ Generated ${assignmentData.length} task assignments`);
  }
  
  return assignmentData;
}

// Generate time entries - ensure each team member has at least 2 entries
async function generateTimeEntries(tasksList: any[], usersList: any[], assignments: any[]) {
  console.log('⏱️  Generating time entries...');
  
  const timeEntryData = [];
  const now = new Date();
  const activeUsers = usersList.filter(user => user.status === 'active');
  
  // Create a map of user assignments
  const userTaskMap = new Map();
  assignments.forEach(assignment => {
    if (!userTaskMap.has(assignment.userId)) {
      userTaskMap.set(assignment.userId, []);
    }
    userTaskMap.get(assignment.userId).push(assignment.taskId);
  });
  
  // Generate time entries for each active user
  activeUsers.forEach(user => {
    const userTasks = userTaskMap.get(user.id) || [];
    
    // Each user gets 2-8 time entries
    const numEntries = Math.floor(Math.random() * 7) + 2;
    
    for (let entry = 0; entry < numEntries; entry++) {
      // Generate date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      
      // Skip weekends for most entries
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Pick a random task assigned to this user, or any task if none assigned
      const taskId = userTasks.length > 0 
        ? userTasks[Math.floor(Math.random() * userTasks.length)]
        : tasksList[Math.floor(Math.random() * tasksList.length)].id;
      
      // Generate realistic start time (between 8 AM and 6 PM)
      const startHour = 8 + Math.floor(Math.random() * 10);
      const startMinute = Math.floor(Math.random() * 60);
      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      // Generate varied durations (30 minutes to 8 hours, both whole and fractional)
      const durationOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
      const durationHours = durationOptions[Math.floor(Math.random() * durationOptions.length)];
      const durationSeconds = Math.floor(durationHours * 3600); // Convert to seconds
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + Math.floor(durationHours * 60));
      
      // Only create entries that end before 8 PM
      if (endTime.getHours() < 20) {
        const notes = generateRealisticNotes();
        
        timeEntryData.push({
          taskId: taskId,
          userId: user.id,
          startTime: startTime,
          endTime: endTime,
          durationManual: durationSeconds, // Set the duration in seconds
          notes: notes
        });
      }
    }
  });
  
  // Add some ongoing time entries
  const ongoingEntries = 5;
  for (let i = 0; i < ongoingEntries; i++) {
    const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];
    const userTasks = userTaskMap.get(user.id) || [];
    const taskId = userTasks.length > 0 
      ? userTasks[Math.floor(Math.random() * userTasks.length)]
      : tasksList[Math.floor(Math.random() * tasksList.length)].id;
    
    const startTime = new Date(now);
    startTime.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
    
    // For ongoing entries, set a partial duration (1-4 hours)
    const ongoingDurationHours = Math.floor(Math.random() * 4) + 1;
    const ongoingDurationSeconds = ongoingDurationHours * 3600;
    
    timeEntryData.push({
      taskId: taskId,
      userId: user.id,
      startTime: startTime,
      endTime: null, // Ongoing entry
      durationManual: ongoingDurationSeconds, // Set partial duration for ongoing work
      notes: 'Currently working on this task'
    });
  }

  if (timeEntryData.length > 0) {
    await db.insert(timeEntries).values(timeEntryData);
    console.log(`✅ Generated ${timeEntryData.length} time entries`);
  }
}

// Generate realistic notes for time entries
function generateRealisticNotes(): string {
  const notes = [
    'Initial concept development and brainstorming',
    'Client meeting and requirements gathering',
    'Design research and inspiration collection',
    'Creating wireframes and mockups',
    'Design iteration and refinement',
    'Client feedback implementation',
    'Final design preparation',
    'Quality assurance and testing',
    'File preparation for production',
    'Client presentation preparation',
    'Brand guideline development',
    'Social media content creation',
    'Print production coordination',
    'Digital asset optimization',
    'Project documentation and handoff',
    'Creative direction and team coordination',
    'Copywriting and content creation',
    'Photography and image editing',
    'Video production and editing',
    'Website development and testing'
  ];
  
  return notes[Math.floor(Math.random() * notes.length)];
}

// Main function to generate all test data
async function generateTestData() {
  try {
    console.log('🚀 Starting creative agency test data generation...');
    
    // Clear existing data
    await clearAllData();
    
    // Generate data in order
    const usersList = await generateUsers();
    const adminUser = usersList.find(user => user.role === 'admin');
    
    const clientsList = await generateClients(adminUser);
    const projectsList = await generateProjects(clientsList);
    const tasksList = await generateTasks(projectsList);
    
    const assignments = await generateTaskAssignments(tasksList, usersList);
    await generateTimeEntries(tasksList, usersList, assignments);
    
    console.log('🎉 Creative agency test data generation completed successfully!');
    console.log(`📊 Generated:`);
    console.log(`   - ${usersList.length} users (creative agency team)`);
    console.log(`   - ${clientsList.length} clients`);
    console.log(`   - ${projectsList.length} projects`);
    console.log(`   - ${tasksList.length} tasks`);
    console.log(`   - ${assignments.length} task assignments`);
    console.log(`   - Multiple time entries with varied durations`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
}

// Export the function for use in other files
export { generateTestData }; 