import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { tasks, projects, clients } from '../../../db/schema';
import { and, ilike, sql } from 'drizzle-orm';

// Returns all non-archived, non-system tasks for dropdown search.
// Optional query param `q` matches client, project, or task name.
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 500;

    // Base where: not archived, not system
    const baseWhere = and(
      sql`COALESCE(${tasks.isSystem}, false) = false`,
      sql`COALESCE(${tasks.archived}, false) = false`
    );

    // Build query
    let query = db
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
      .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
      .where(baseWhere)
      .orderBy(tasks.createdAt)
      .limit(limit);

    // Apply search if provided
    if (q && q.trim().length > 0) {
      const like = `%${q.trim()}%`;
      query = db
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
        .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
        .leftJoin(clients, sql`${projects.clientId} = ${clients.id}`)
        .where(and(
          baseWhere,
          sql`(${ilike(tasks.name, like)} OR ${ilike(projects.name, like)} OR ${ilike(clients.name, like)})`
        ))
        .orderBy(tasks.createdAt)
        .limit(limit);
    }

    const results = await query;

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error searching tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to search tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


