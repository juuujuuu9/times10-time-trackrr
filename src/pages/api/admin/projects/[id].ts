import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { projects, tasks, taskAssignments, timeEntries } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectId = parseInt(id);

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(project[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectId = parseInt(id);

    // First, get all tasks for this project
    const projectTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const taskIds = projectTasks.map(task => task.id);

    if (taskIds.length > 0) {
      // Delete time entries for all tasks in this project
      for (const taskId of taskIds) {
        await db
          .delete(timeEntries)
          .where(eq(timeEntries.taskId, taskId));
      }

      // Delete task assignments for all tasks in this project
      for (const taskId of taskIds) {
        await db
          .delete(taskAssignments)
          .where(eq(taskAssignments.taskId, taskId));
      }

      // Delete all tasks for this project
      await db
        .delete(tasks)
        .where(eq(tasks.projectId, projectId));
    }

    // Finally, delete the project
    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (deletedProject.length === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Project deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 