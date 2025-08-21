import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { tasks } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const allTasks = await db.select().from(tasks);
    return new Response(JSON.stringify(allTasks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, projectId, status } = body;

    if (!name || !projectId) {
      return new Response(JSON.stringify({ error: 'Task name and project ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newTask = await db.insert(tasks).values({
      name,
      description: description || null,
      projectId: parseInt(projectId),
      status: status || 'pending',
    }).returning();

    return new Response(JSON.stringify(newTask[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return new Response(JSON.stringify({ error: 'Failed to create task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, description, projectId, status } = body;

    console.log('PUT /api/admin/tasks - Request body:', body);

    if (!id || !name || !projectId) {
      console.log('PUT /api/admin/tasks - Validation failed:', { id, name, projectId });
      return new Response(JSON.stringify({ error: 'Task ID, name, and project ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('PUT /api/admin/tasks - Updating task with ID:', id);
    
    const updatedTask = await db
      .update(tasks)
      .set({ 
        name, 
        description: description || null,
        projectId: parseInt(projectId),
        status: status || 'pending',
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    console.log('PUT /api/admin/tasks - Update result:', updatedTask);

    if (updatedTask.length === 0) {
      console.log('PUT /api/admin/tasks - Task not found');
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('PUT /api/admin/tasks - Task updated successfully');
    return new Response(JSON.stringify(updatedTask[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT /api/admin/tasks - Error updating task:', error);
    return new Response(JSON.stringify({ error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 