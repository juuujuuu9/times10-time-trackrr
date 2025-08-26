import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users, clients, projects, tasks, taskAssignments, timeEntries } from '../../db/schema';
import { eq } from 'drizzle-orm';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const POST: APIRoute = async () => {
  try {
    // Ensure we have active users
    const activeUsers = await db.select().from(users).where(eq(users.status, 'active'));
    if (activeUsers.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No active users found. Create users first.' }), { status: 400 });
    }

    // Create exactly 5 clients
    const clientNames = [
      'Client Alpha',
      'Client Bravo',
      'Client Charlie',
      'Client Delta',
      'Client Echo'
    ];

    // Pick a creator (first active user)
    const createdByUserId = activeUsers[0].id;

    const createdClients = await db.insert(clients).values(
      clientNames.map((name) => ({ name, createdBy: createdByUserId, archived: false }))
    ).returning();

    // Create 1 project per client
    const createdProjects = await db.insert(projects).values(
      createdClients.map((c) => ({ clientId: c.id, name: `${c.name} Main Project`, archived: false }))
    ).returning();

    // Create 20 tasks total, divided equally among 5 clients => 4 per client
    const baseTaskNames = ['Research', 'Design', 'Implementation', 'QA', 'Review', 'Docs'];
    const createdTasks = [] as { id: number; projectId: number }[];
    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      for (let t = 0; t < 4; t++) {
        const [inserted] = await db.insert(tasks).values({
          projectId: project.id,
          name: `${randomChoice(baseTaskNames)} ${t + 1}`,
          description: `Task ${t + 1} for ${project.name}`,
          status: 'in_progress',
          archived: false
        }).returning({ id: tasks.id, projectId: tasks.projectId });
        createdTasks.push(inserted);
      }
    }

    // Assign each task to multiple users (spread across team)
    const assignmentRows: { taskId: number; userId: number }[] = [];
    for (const task of createdTasks) {
      // Assign 2-4 random users per task
      const shuffled = [...activeUsers].sort(() => Math.random() - 0.5);
      const numAssignees = Math.min(4, Math.max(2, Math.floor(Math.random() * 4) + 1));
      for (let i = 0; i < numAssignees && i < shuffled.length; i++) {
        assignmentRows.push({ taskId: task.id, userId: shuffled[i].id });
      }
    }
    if (assignmentRows.length > 0) {
      await db.insert(taskAssignments).values(assignmentRows);
    }

    // Generate varied time entries for the last 30 days
    const now = new Date();
    const entries: any[] = [];
    for (const user of activeUsers) {
      // 6-15 entries per user
      const numEntries = 6 + Math.floor(Math.random() * 10);
      for (let i = 0; i < numEntries; i++) {
        // pick a weekday in last 30 days
        let dayOffset = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(now.getDate() - dayOffset);
        if (date.getDay() === 0 || date.getDay() === 6) {
          // move to previous Friday if weekend
          const back = date.getDay() === 0 ? 2 : 1;
          date.setDate(date.getDate() - back);
        }

        // select a task assigned to this user, or any created task
        const userAssignedTaskIds = assignmentRows.filter(a => a.userId === user.id).map(a => a.taskId);
        const chosenTaskId = (userAssignedTaskIds.length > 0 ? randomChoice(userAssignedTaskIds) : randomChoice(createdTasks).id);

        // random start between 8-17
        const startHour = 8 + Math.floor(Math.random() * 9);
        const startMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(date);
        startTime.setHours(startHour, startMinute, 0, 0);

        // durations: 0.5h - 6h
        const durations = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];
        const durHrs = randomChoice(durations);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + Math.floor(durHrs * 60));

        // store seconds in durationManual for consistency with reports endpoint
        const durationManual = Math.floor(durHrs * 3600);

        entries.push({
          taskId: chosenTaskId,
          userId: user.id,
          startTime,
          endTime,
          durationManual,
          notes: 'Demo work session'
        });
      }
    }

    if (entries.length > 0) {
      await db.insert(timeEntries).values(entries);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Reports demo data generated',
      data: {
        clients: createdClients.length,
        projects: createdProjects.length,
        tasks: createdTasks.length,
        assignments: assignmentRows.length,
        entries: entries.length
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error generating reports demo data:', error);
    return new Response(JSON.stringify({ success: false, message: 'Generation failed' }), { status: 500 });
  }
};


