import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskAssignments, projects, users, clients } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const assignedTo = searchParams.get('assignedTo');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200; // show more by default
    const assignedOnly = searchParams.get('assignedOnly') === 'true';
    
    // If assignedOnly=true we require assignedTo. Otherwise we will return all tasks (non-archived)
    if (assignedOnly && !assignedTo) {
      return new Response(JSON.stringify({
        error: 'assignedTo parameter is required when assignedOnly=true'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) Tasks explicitly assigned to the user (non-system)
    const assignedTasks = assignedTo ? await db
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
        sql`COALESCE(${tasks.isSystem}, false) = false`
      ))
      .orderBy(tasks.createdAt)
      .limit(limit) : [];

    // 2) Additionally include any tasks the user has time entries for in the last 180 days
    //    This preserves visibility for migrated/unassigned tasks with historical entries
    const { timeEntries } = await import('../../db/schema');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 180);

    const tasksWithEntries = assignedTo ? await db
      .select({
        id: projects.id,
        name: projects.name,
        description: sql<string>`''`.as('description'),
        status: sql<string>`'active'`.as('status'),
        archived: projects.archived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        projectName: projects.name,
        projectId: projects.id,
        clientName: clients.name,
        clientId: clients.id
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, parseInt(assignedTo)),
        eq(projects.archived, false)
      ))
      .groupBy(projects.id, projects.name, projects.archived, projects.createdAt, projects.updatedAt, clients.name, clients.id)
      .orderBy(projects.createdAt)
      .limit(limit) : [];

    // 3) If not assignedOnly, include ALL non-archived, non-system tasks regardless of assignment
    //    Use LEFT JOINs to be resilient to any dangling relationships after migration
    const allNonArchived = assignedOnly ? [] : await db
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
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(tasks.archived, false),
        sql`COALESCE(${tasks.isSystem}, false) = false`
      ))
      .orderBy(tasks.createdAt)
      .limit(limit);

    // Merge and de-duplicate by task id (no creator/owner filtering by design)
    const map = new Map<number, any>();
    for (const t of assignedTasks) map.set(t.id, t);
    for (const t of tasksWithEntries) map.set(t.id, t);
    for (const t of allNonArchived) map.set(t.id, t);
    let merged = Array.from(map.values());

    // Fallback: if merged is empty, return raw non-archived tasks directly from tasks table
    let fallbackUsed = false;
    if (merged.length === 0) {
      fallbackUsed = true;
      // Ultra-simple fallback: just get non-archived tasks, no joins at all
      merged = await db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          status: tasks.status,
          archived: tasks.archived,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          projectName: sql<string>`'Unknown Project'`.as('project_name'),
          projectId: sql<number>`0`.as('project_id'),
          clientName: sql<string>`'Unknown Client'`.as('client_name'),
          clientId: sql<number>`0`.as('client_id')
        })
        .from(tasks)
        .where(and(
          eq(tasks.archived, false),
          sql`COALESCE(${tasks.isSystem}, false) = false`
        ))
        .orderBy(tasks.createdAt)
        .limit(limit);
    }

    const result = merged.slice(0, limit);

    return new Response(JSON.stringify({
      data: result,
      meta: {
        counts: {
          assigned: assignedTasks.length,
          withEntries: tasksWithEntries.length,
          allNonArchived: allNonArchived.length,
          merged: merged.length
        },
        fallbackUsed
      }
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