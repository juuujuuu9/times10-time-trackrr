import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const assignedTo = searchParams.get('assignedTo');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200; // show more by default
    
    if (!assignedTo) {
      return new Response(JSON.stringify({
        error: 'assignedTo parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) Tasks explicitly assigned to the user (non-system)
    const assignedTasks = await db
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
        eq(tasks.archived, false),
        eq(tasks.isSystem, false)
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    // 2) Additionally include any tasks the user has time entries for in the last 180 days
    //    This preserves visibility for migrated/unassigned tasks with historical entries
    const { timeEntries } = await import('../../db/schema');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 180);

    const tasksWithEntries = await db
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
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, parseInt(assignedTo)),
        eq(tasks.archived, false),
        eq(tasks.isSystem, false)
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    // Merge and de-duplicate by task id
    const map = new Map<number, any>();
    for (const t of assignedTasks) map.set(t.id, t);
    for (const t of tasksWithEntries) map.set(t.id, t);
    const merged = Array.from(map.values()).slice(0, limit);

    return new Response(JSON.stringify({
      data: merged
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