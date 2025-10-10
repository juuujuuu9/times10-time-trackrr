import type { APIRoute } from 'astro';
import { db } from '../../db';
import { projects, clients, tasks, taskAssignments } from '../../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const recent = searchParams.get('recent') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    let query = db
      .select({
        id: projects.id,
        name: projects.name,
        archived: projects.archived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
        clientId: clients.id,
        taskCount: sql<number>`COUNT(DISTINCT ${tasks.id})`.as('task_count')
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .where(and(
        eq(projects.archived, false),
        eq(clients.archived, false)
      ))
      .groupBy(projects.id, projects.name, projects.archived, projects.createdAt, projects.updatedAt, clients.name, clients.id);

    // If userId is provided, show all projects (not just assigned ones)
    // This allows the time tracker dropdown to show all available projects
    // No additional filtering needed - we already filter by non-archived projects and clients

    // Order by creation date (most recent first)
    query = query.orderBy(desc(projects.createdAt));

    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }

    const userProjects = await query;

    return new Response(JSON.stringify({
      data: userProjects
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch projects'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 