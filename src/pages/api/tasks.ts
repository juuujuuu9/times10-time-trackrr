import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const assignedTo = searchParams.get('assignedTo');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    if (!assignedTo) {
      return new Response(JSON.stringify({
        error: 'assignedTo parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userTasks = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        status: tasks.status,
        archived: tasks.archived,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        projectId: projects.id,
        clientName: clients.name,
        clientId: clients.id
      })
      .from(tasks)
      .innerJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(taskAssignments.userId, parseInt(assignedTo)),
        eq(tasks.archived, false)
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    return new Response(JSON.stringify({
      data: userTasks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch tasks'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 