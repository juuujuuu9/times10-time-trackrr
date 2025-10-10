import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { projects, users, timeEntries, tasks, taskAssignments, clients } from '../../../../db/schema';
import { eq, and, sql, or, isNotNull } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  try {
    const projectName = params.name;
    
    if (!projectName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Team Members API] Starting request for project: ${projectName}`);
    const startTime = Date.now();

    // Find the project by name
    const project = await db
      .select({
        id: projects.id,
        name: projects.name,
        clientId: projects.clientId,
        clientName: clients.name
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(projects.name, decodeURIComponent(projectName)),
        eq(projects.archived, false),
        eq(clients.archived, false)
      ))
      .limit(1);

    if (project.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const projectData = project[0];
    console.log(`[Team Members API] Found project: ${projectData.name} (ID: ${projectData.id})`);

    // Simplified query - get users who have time entries for this project
    const timeEntryUsers = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        payRate: users.payRate,
        totalHours: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.durationManual} IS NOT NULL 
            THEN ${timeEntries.durationManual}
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
            ELSE 0
          END
        ), 0)`.as('total_hours'),
        totalCost: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${timeEntries.durationManual} IS NOT NULL 
            THEN ROUND((${timeEntries.durationManual} / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
            WHEN ${timeEntries.endTime} IS NOT NULL 
            THEN ROUND((EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime})) / 3600 * COALESCE(${users.payRate}, 0))::numeric, 2)
            ELSE 0
          END
        ), 0)`.as('total_cost')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .where(and(
        eq(timeEntries.projectId, projectData.id),
        or(
          and(isNotNull(timeEntries.endTime)),
          and(isNotNull(timeEntries.durationManual))
        )
      ))
      .groupBy(users.id, users.name, users.email, users.payRate);

    console.log(`[Team Members API] Found ${timeEntryUsers.length} users with time entries`);

    // Get users assigned to tasks (simplified)
    const taskAssignedUsers = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        payRate: users.payRate
      })
      .from(taskAssignments)
      .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
      .innerJoin(users, eq(taskAssignments.userId, users.id))
      .where(and(
        eq(tasks.projectId, projectData.id),
        eq(tasks.archived, false)
      ))
      .groupBy(users.id, users.name, users.email, users.payRate);

    console.log(`[Team Members API] Found ${taskAssignedUsers.length} users assigned to tasks`);

    // Combine and deduplicate team members
    const allMembers = new Map();
    
    // Add users with time entries
    timeEntryUsers.forEach(member => {
      allMembers.set(member.userId, {
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        payRate: member.payRate || 0,
        hours: member.totalHours / 3600, // Convert seconds to hours
        cost: member.totalCost,
        hasTimeEntries: true
      });
    });

    // Add users assigned to tasks (but not already in the map)
    taskAssignedUsers.forEach(member => {
      if (!allMembers.has(member.userId)) {
        allMembers.set(member.userId, {
          id: member.userId,
          name: member.userName,
          email: member.userEmail,
          payRate: member.payRate || 0,
          hours: 0,
          cost: 0,
          hasTimeEntries: false
        });
      }
    });

    const teamMembers = Array.from(allMembers.values());
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[Team Members API] Total team members: ${teamMembers.length}`);
    console.log(`[Team Members API] Request completed in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        project: {
          id: projectData.id,
          name: projectData.name,
          clientName: projectData.clientName
        },
        teamMembers
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team members',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
