import type { APIRoute } from 'astro';
import { db } from '../../../../db/index';
import { tasks, taskAssignments, timeEntries, sessions, taskDiscussions, taskFiles, taskLinks, taskNotes } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    console.log('GET task API called');
    
    // Get current user and verify admin access
    const currentUser = await getSessionUser(context);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Insufficient permissions'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = context.params;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid task ID format',
        error: 'Task ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get task with project information
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        project: true
      }
    });

    if (!task) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        projectName: task.project?.name || 'Unknown Project',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    console.log('PUT task API called');
    
    // Get current user and verify admin access
    const currentUser = await getSessionUser(context);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Insufficient permissions'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = context.params;
    const body = await context.request.json();
    const { status } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!status) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Status is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid task ID format',
        error: 'Task ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid status',
        error: `Status must be one of: ${validStatuses.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if task exists
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });

    if (!existingTask) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the task status
    const updatedTask = await db
      .update(tasks)
      .set({ 
        status: status,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    console.log('DELETE task API called');
    
    // Test database connection
    console.log('Testing database connection...');
    try {
      await db.query.tasks.findFirst();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get current user and verify admin access
    console.log('Getting session user...');
    const currentUser = await getSessionUser(context);
    console.log('Current user:', currentUser ? { id: currentUser.id, role: currentUser.role } : 'null');
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
      console.log('Unauthorized access - user role:', currentUser?.role);
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'Insufficient permissions'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = context.params;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);
    console.log('Task ID from params:', taskId);
    
    if (isNaN(taskId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid task ID format',
        error: 'Task ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if task exists
    console.log('Checking if task exists...');
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });
    console.log('Existing task:', existingTask ? { id: existingTask.id, name: existingTask.name } : 'null');

    if (!existingTask) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete in correct order to avoid foreign key constraints
    console.log('Step 1: Deleting task assignments...');
    try {
      const deletedAssignments = await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId)).returning();
      console.log('Task assignments deleted:', deletedAssignments.length);
    } catch (assignmentError) {
      console.error('Error deleting task assignments:', assignmentError);
      throw assignmentError;
    }

    console.log('Step 2: Deleting task discussions...');
    try {
      const deletedDiscussions = await db.delete(taskDiscussions).where(eq(taskDiscussions.taskId, taskId)).returning();
      console.log('Task discussions deleted:', deletedDiscussions.length);
    } catch (discussionError) {
      console.error('Error deleting task discussions:', discussionError);
      throw discussionError;
    }

    console.log('Step 3: Deleting task files...');
    try {
      const deletedFiles = await db.delete(taskFiles).where(eq(taskFiles.taskId, taskId)).returning();
      console.log('Task files deleted:', deletedFiles.length);
    } catch (fileError) {
      console.error('Error deleting task files:', fileError);
      throw fileError;
    }

    console.log('Step 4: Deleting task links...');
    try {
      const deletedLinks = await db.delete(taskLinks).where(eq(taskLinks.taskId, taskId)).returning();
      console.log('Task links deleted:', deletedLinks.length);
    } catch (linkError) {
      console.error('Error deleting task links:', linkError);
      throw linkError;
    }

    console.log('Step 5: Deleting task notes...');
    try {
      const deletedNotes = await db.delete(taskNotes).where(eq(taskNotes.taskId, taskId)).returning();
      console.log('Task notes deleted:', deletedNotes.length);
    } catch (noteError) {
      console.error('Error deleting task notes:', noteError);
      throw noteError;
    }

    console.log('Step 6: Skipping time entries deletion...');
    console.log('Note: Time entries are project-level, not task-level. They will remain valid for the project.');

    console.log('Step 7: Deleting task...');
    try {
      const deletedTask = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
      console.log('Task deleted successfully:', deletedTask.length);
    } catch (taskError) {
      console.error('Error deleting task:', taskError);
      throw taskError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Task deleted successfully. All user assignments, discussions, files, links, and notes have been removed. Time entries remain valid for the project.',
      data: {
        deletedTaskId: taskId,
        deletedTaskName: existingTask.name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 