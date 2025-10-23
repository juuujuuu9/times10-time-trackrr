import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { tasks, taskAssignments, users, projects } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { sendDueDateChangeEmail } from '../../../utils/email';
import { getSessionUser } from '../../../utils/session';
import { getEmailBaseUrl } from '../../../utils/url';

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
    console.log('POST /api/admin/tasks - Starting task creation - VERSION 2.0');
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

    // Use direct postgres connection to avoid Drizzle issues
    console.log('POST /api/admin/tasks - Using direct postgres connection');
    
    // Get database URL from environment
    const databaseUrl = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
    console.log('POST /api/admin/tasks - DATABASE_URL check:');
    console.log('  - import.meta.env.DATABASE_URL:', import.meta.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('  - process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('  - Final databaseUrl:', databaseUrl ? 'SET' : 'NOT SET');
    
    if (!databaseUrl) {
      console.error('POST /api/admin/tasks - DATABASE_URL is not available in production environment');
      throw new Error('DATABASE_URL environment variable is not set in production');
    }
    
    const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });
    
    try {
      // Debug: Check what database we're connected to
      console.log('POST /api/admin/tasks - Testing database connection...');
      const dbInfo = await sql`SELECT current_database(), current_user, version()`;
      console.log('POST /api/admin/tasks - Connected to database:', dbInfo[0]);
      
      // Debug: Check if tasks table exists
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      `;
      console.log('POST /api/admin/tasks - Tasks table exists:', tableCheck.length > 0);
      
      if (tableCheck.length === 0) {
        console.error('POST /api/admin/tasks - Tasks table does not exist in this database!');
        throw new Error('Tasks table does not exist in production database');
      }
      
      const newTask = await sql`
        INSERT INTO tasks (project_id, name, description, status, priority, due_date) 
        VALUES (${parseInt(projectId)}, ${name}, ${description || null}, ${status || 'pending'}, ${priority || 'regular'}, ${dueDate ? new Date(dueDate + 'T12:00:00') : null}) 
        RETURNING id, project_id, name, description, status, priority, due_date, archived, is_system, created_at, updated_at
      `;
      
      console.log('POST /api/admin/tasks - Task created successfully:', newTask[0]);
      return new Response(JSON.stringify(newTask[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      await sql.end();
    }
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

export const PUT: APIRoute = async ({ request, cookies }) => {
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

    // Get current user for email notifications
    const currentUser = await getSessionUser({ cookies } as any);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('PUT /api/admin/tasks - Updating task with ID:', id);
    
    // Get existing task to check for due date changes
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(id)),
      with: {
        project: true,
        assignments: {
          with: {
            user: true
          }
        }
      }
    });

    if (!existingTask) {
      console.log('PUT /api/admin/tasks - Task not found');
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store old due date for email notifications
    const oldDueDate = existingTask.dueDate;
    const newDueDate = dueDate ? new Date(dueDate + 'T12:00:00') : null;
    
    const updatedTask = await db
      .update(tasks)
      .set({ 
        name, 
        description: description || null,
        projectId: parseInt(projectId),
        status: status || 'pending',
        priority: priority || 'regular',
        dueDate: newDueDate,
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

    // Send due date change notifications if due date changed
    if (oldDueDate !== newDueDate && existingTask.assignments && existingTask.assignments.length > 0) {
      try {
        const baseUrl = getEmailBaseUrl();
        const dashboardUrl = `${baseUrl}/admin/collaborations/${existingTask.teamId || 'general'}`;
        
        // Send due date change notifications to all assignees
        for (const assignment of existingTask.assignments) {
          if (assignment.user && assignment.user.email && assignment.user.id !== currentUser.id) {
            try {
              console.log(`📧 Attempting to send due date change email to ${assignment.user.email}`);
              await sendDueDateChangeEmail({
                email: assignment.user.email,
                userName: assignment.user.name,
                taskName: existingTask.name,
                projectName: existingTask.project?.name || 'Unknown Project',
                oldDueDate: oldDueDate ? oldDueDate.toLocaleDateString() : 'No due date',
                newDueDate: newDueDate ? newDueDate.toLocaleDateString() : 'No due date',
                changedBy: currentUser.name,
                dashboardUrl: dashboardUrl,
              });
              console.log(`📧 Due date change email sent to ${assignment.user.email}`);
            } catch (emailError) {
              console.error(`Failed to send due date change email to ${assignment.user.email}:`, emailError);
              // Don't fail the entire operation if email fails
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending due date change notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
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