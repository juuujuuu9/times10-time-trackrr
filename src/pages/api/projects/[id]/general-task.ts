import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { tasks, projects, users, taskAssignments } from '../../../../db/schema';
import { and, eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const projectIdParam = params.id;
    if (!projectIdParam) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectId = parseInt(projectIdParam);
    if (Number.isNaN(projectId)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure project exists
    const [proj] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!proj) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the appropriate task for this project
    // For "Time Tracking" projects, look for "General" task
    // For other projects, look for task with same name as project
    const expectedTaskName = proj.name === 'Time Tracking' ? 'General' : proj.name;
    let [general] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.name, expectedTaskName)));

    // Create if missing
    if (!general) {
      const [created] = await db
        .insert(tasks)
        .values({
          name: expectedTaskName,
          projectId,
          description: proj.name === 'Time Tracking' 
            ? `General time tracking for ${proj.name}` 
            : `Work on ${proj.name}`,
          isSystem: true,
        })
        .returning();
      general = created;

      // Best-effort: assign to all active users
      try {
        const activeUsers = await db.select().from(users).where(eq(users.status, 'active'));
        if (activeUsers.length > 0) {
          const assignmentData = activeUsers.map((u) => ({ taskId: general.id, userId: u.id }));
          await db.insert(taskAssignments).values(assignmentData);
        }
      } catch (e) {
        console.warn('Skipping General task assignments due to error:', e);
      }
    }

    return new Response(
      JSON.stringify({ id: general.id, name: general.name, projectId: general.projectId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching/ensuring General task:', error);
    return new Response(JSON.stringify({ error: 'Failed to get General task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


