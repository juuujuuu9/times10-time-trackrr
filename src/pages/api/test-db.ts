import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users, clients, projects, tasks, timeEntries } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Test the connection by querying all tables
    const allUsers = await db.select().from(users);
    const activeUsers = await db.select().from(users).where(eq(users.status, 'active'));
    const allClients = await db.select().from(clients);
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const allTimeEntries = await db.select().from(timeEntries);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful!',
      counts: {
        users: activeUsers.length,
        clients: allClients.length,
        projects: allProjects.length,
        tasks: allTasks.length,
        timeEntries: allTimeEntries.length
      },
      data: {
        users: activeUsers,
        clients: allClients,
        projects: allProjects,
        tasks: allTasks,
        timeEntries: allTimeEntries
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_user':
        if (!data.name || !data.email) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Name and email are required for user creation'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const [newUser] = await db.insert(users).values({
          name: data.name,
          email: data.email,
          role: data.role || 'user',
          status: data.status || 'active'
        }).returning();

        return new Response(JSON.stringify({
          success: true,
          message: 'User created successfully!',
          user: newUser
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'create_client':
        if (!data.name || !data.createdBy) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Name and createdBy are required for client creation'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const [newClient] = await db.insert(clients).values({
          name: data.name,
          createdBy: data.createdBy
        }).returning();

        return new Response(JSON.stringify({
          success: true,
          message: 'Client created successfully!',
          client: newClient
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'create_project':
        if (!data.name || !data.clientId) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Name and clientId are required for project creation'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const [newProject] = await db.insert(projects).values({
          name: data.name,
          clientId: data.clientId
        }).returning();

        return new Response(JSON.stringify({
          success: true,
          message: 'Project created successfully!',
          project: newProject
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'create_task':
        if (!data.name || !data.projectId) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Name and projectId are required for task creation'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const [newTask] = await db.insert(tasks).values({
          name: data.name,
          projectId: data.projectId,
          description: data.description,
          status: data.status || 'pending'
        }).returning();

        return new Response(JSON.stringify({
          success: true,
          message: 'Task created successfully!',
          task: newTask
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'create_time_entry':
        if (!data.taskId || !data.userId || !data.startTime) {
          return new Response(JSON.stringify({
            success: false,
            message: 'taskId, userId, and startTime are required for time entry creation'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const [newTimeEntry] = await db.insert(timeEntries).values({
          taskId: data.taskId,
          userId: data.userId,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : null,
          durationManual: data.durationManual,
          notes: data.notes
        }).returning();

        return new Response(JSON.stringify({
          success: true,
          message: 'Time entry created successfully!',
          timeEntry: newTimeEntry
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          message: 'Invalid action. Supported actions: create_user, create_client, create_project, create_task, create_time_entry'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in POST request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 