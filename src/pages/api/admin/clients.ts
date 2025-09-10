import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { clients, projects, tasks, users, taskAssignments } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

export const GET: APIRoute = async () => {
  try {
    const allClients = await db.select().from(clients);
    return new Response(JSON.stringify(allClients), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch clients', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Client name is required and must be a non-empty string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trim the name to remove leading/trailing whitespace
    const trimmedName = name.trim();

    // Create the client
    const newClient = await db.insert(clients).values({
      name: trimmedName,
      createdBy: user.id,
    }).returning();

    console.log('Client created successfully:', newClient[0]);

    // Create the "Time Tracking" project for this client
    const timeTrackingProject = await db.insert(projects).values({
      name: 'Time Tracking',
      clientId: newClient[0].id,
      isSystem: true, // Mark as system-generated
    }).returning();

    console.log('Time Tracking project created:', timeTrackingProject[0]);

    // Get all active users to assign the General task to everyone
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users to assign General task to`);

    // Create the "General" task for the Time Tracking project
    const generalTask = await db.insert(tasks).values({
      name: 'General',
      projectId: timeTrackingProject[0].id,
      description: `General time tracking for ${trimmedName}`,
      isSystem: true, // Mark as system-generated
    }).returning();

    console.log('General task created:', generalTask[0]);

    // Assign the General task to all active users
    if (allUsers.length > 0) {
      const assignmentData = allUsers.map(user => ({
        taskId: generalTask[0].id,
        userId: user.id,
      }));

      console.log('Creating task assignments:', assignmentData);
      try {
        const assignments = await db.insert(taskAssignments).values(assignmentData).returning();
        console.log(`Successfully assigned General task to ${assignments.length} users:`, assignments);
      } catch (assignmentError) {
        console.error('Error creating task assignments:', assignmentError);
        // Don't fail the entire operation if assignments fail - the client and task are still created
        // The user can manually assign tasks if needed
      }
    } else {
      console.warn('No active users found to assign General task to');
    }

    const result = newClient[0];

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating client:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create client';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'A client with this name already exists';
        statusCode = 409;
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid user reference';
        statusCode = 400;
      } else if (error.message.includes('not null')) {
        errorMessage = 'Required field is missing';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user for consistency
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Client ID and name are required. Name must be a non-empty string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trim the name to remove leading/trailing whitespace
    const trimmedName = name.trim();

    const updatedClient = await db
      .update(clients)
      .set({ name: trimmedName, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();

    if (updatedClient.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Client updated successfully:', updatedClient[0]);

    return new Response(JSON.stringify(updatedClient[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating client:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to update client';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'A client with this name already exists';
        statusCode = 409;
      } else if (error.message.includes('not null')) {
        errorMessage = 'Required field is missing';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the authenticated user for consistency
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, archived } = body;

    if (id === undefined || archived === undefined) {
      return new Response(JSON.stringify({ error: 'Client ID and archived status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedClient = await db
      .update(clients)
      .set({ archived, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();

    if (updatedClient.length === 0) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Client archive status updated successfully:', updatedClient[0]);

    return new Response(JSON.stringify(updatedClient[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error archiving/unarchiving client:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update client archive status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 