import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { projects, clients } from '../../../../db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const showAll = url.searchParams.get('all') === 'true';

    // If showAll is true, return all projects and clients regardless of search term
    if (showAll) {
      // Add "All Clients" and "All Projects" options at the top
      const allClientsOption = {
        type: 'all-clients',
        projectId: null,
        projectName: null,
        clientId: null,
        clientName: null,
        displayName: 'All Clients',
        description: 'Shows costs by client'
      };

      const allProjectsOption = {
        type: 'all-projects',
        projectId: null,
        projectName: null,
        clientId: null,
        clientName: null,
        displayName: 'All Projects',
        description: 'Shows all individual projects in alphabetical order by client'
      };

      // Get all projects with client names, sorted by client name then project name
      const allProjectResults = await db
        .select({
          type: sql<string>`'project'`.as('type'),
          projectId: projects.id,
          projectName: projects.name,
          clientId: clients.id,
          clientName: clients.name,
          displayName: projects.name,
          description: clients.name
        })
        .from(projects)
        .innerJoin(clients, eq(projects.clientId, clients.id))
        .where(
          and(
            eq(projects.archived, false),
            eq(clients.archived, false)
          )
        )
        .orderBy(clients.name, projects.name)
        .limit(limit);

      // Get all clients
      const allClientResults = await db
        .select({
          type: sql<string>`'client'`.as('type'),
          projectId: sql<number>`NULL`.as('project_id'),
          projectName: sql<string>`NULL`.as('project_name'),
          clientId: clients.id,
          clientName: clients.name,
          displayName: clients.name,
          description: sql<string>`'(All Projects)'`.as('description')
        })
        .from(clients)
        .where(eq(clients.archived, false))
        .orderBy(clients.name)
        .limit(limit);

      // Combine and sort results
      const allResults = [allClientsOption, allProjectsOption, ...allClientResults, ...allProjectResults];
      allResults.sort((a, b) => {
        // Keep "All" options at the top
        if (a.type === 'all-clients') return -1;
        if (b.type === 'all-clients') return 1;
        if (a.type === 'all-projects') return -1;
        if (b.type === 'all-projects') return 1;
        // Sort by type first (clients first), then by display name
        if (a.type !== b.type) {
          return a.type === 'client' ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      });

      return new Response(JSON.stringify(allResults.slice(0, limit)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!searchTerm.trim()) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Search for projects with client names
    const projectResults = await db
      .select({
        type: sql<string>`'project'`.as('type'),
        projectId: projects.id,
        projectName: projects.name,
        clientId: clients.id,
        clientName: clients.name,
        displayName: projects.name,
        description: clients.name
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(projects.archived, false),
          eq(clients.archived, false),
          or(
            ilike(projects.name, `%${searchTerm}%`),
            ilike(clients.name, `%${searchTerm}%`)
          )
        )
      )
      .orderBy(clients.name, projects.name)
      .limit(limit);

    // Search for clients
    const clientResults = await db
      .select({
        type: sql<string>`'client'`.as('type'),
        projectId: sql<number>`NULL`.as('project_id'),
        projectName: sql<string>`NULL`.as('project_name'),
        clientId: clients.id,
        clientName: clients.name,
        displayName: clients.name,
        description: sql<string>`'(All Projects)'`.as('description')
      })
      .from(clients)
      .where(
        and(
          eq(clients.archived, false),
          ilike(clients.name, `%${searchTerm}%`)
        )
      )
      .orderBy(clients.name)
      .limit(limit);

    // Combine and sort results
    const allResults = [...projectResults, ...clientResults];
    allResults.sort((a, b) => {
      // Sort by type first (clients first), then by display name
      if (a.type !== b.type) {
        return a.type === 'client' ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return new Response(JSON.stringify(allResults.slice(0, limit)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error searching projects and clients:', error);
    return new Response(JSON.stringify({ error: 'Failed to search projects and clients' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
