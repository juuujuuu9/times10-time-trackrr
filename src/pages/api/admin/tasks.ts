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
    console.log('POST /api/admin/tasks - Starting task creation');
    const body = await request.json();
    console.log('POST /api/admin/tasks - Request body:', body);
    const { name, description, projectId, status, priority, dueDate } = body;

    if (!name || !projectId) {
      console.log('POST /api/admin/tasks - Validation failed:', { name, projectId });
      return new Response(JSON.stringify({ error: 'Task name and project ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('POST /api/admin/tasks - Attempting to insert task with data:', {
      name,
      description: description || null,
      projectId: parseInt(projectId),
      status: status || 'pending',
      priority: priority || 'regular',
      dueDate: dueDate ? new Date(dueDate + 'T12:00:00') : null
    });

    // Only include fields that we explicitly want to set
    const taskData: any = {
      name,
      projectId: parseInt(projectId),
    };
    
    // Add optional fields only if they have values
    if (description) {
      taskData.description = description;
    }
    if (status) {
      taskData.status = status;
    }
    if (priority) {
      taskData.priority = priority;
    }
    if (dueDate) {
      taskData.dueDate = new Date(dueDate + 'T12:00:00'); // Set to noon to avoid timezone issues
    }
    
    console.log('POST /api/admin/tasks - Final task data:', taskData);
    
    const newTask = await db.insert(tasks).values(taskData).returning();

    console.log('POST /api/admin/tasks - Task created successfully:', newTask[0]);
    return new Response(JSON.stringify(newTask[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/admin/tasks - Error creating task:', error);
    console.error('POST /api/admin/tasks - Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('POST /api/admin/tasks - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create task';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('relation "tasks" does not exist')) {
        errorMessage = 'Database table "tasks" does not exist. Please run database migration.';
        statusCode = 500;
      } else if (error.message.includes('relation "projects" does not exist')) {
        errorMessage = 'Database table "projects" does not exist. Please run database migration.';
        statusCode = 500;
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Database permission denied. Check database user permissions.';
        statusCode = 500;
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection failed. Check DATABASE_URL configuration.';
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'database_error'
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, description, projectId, status, priority, dueDate } = body;

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
        priority: priority || 'regular',
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00') : null, // Set to noon to avoid timezone issues
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

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, priority } = body;

    if (!id || !priority) {
      return new Response(JSON.stringify({ error: 'Task ID and priority are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedTask = await db
      .update(tasks)
      .set({ 
        priority: priority,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    if (updatedTask.length === 0) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedTask[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating task priority:', error);
    return new Response(JSON.stringify({ error: 'Failed to update task priority' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 