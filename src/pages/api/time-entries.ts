import type { APIRoute } from 'astro';
import { db } from '../../db';
import { timeEntries, users, tasks, projects, clients } from '../../db/schema';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        updatedAt: timeEntries.updatedAt,
        userName: users.name,
        taskName: tasks.name,
        projectName: projects.name,
        clientName: clients.name,
        duration: sql<number>`CASE 
          WHEN ${timeEntries.durationManual} IS NOT NULL 
          THEN ${timeEntries.durationManual}
          WHEN ${timeEntries.endTime} IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))
          ELSE 0
        END`.as('duration')
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(
        eq(timeEntries.userId, parseInt(userId)),
        isNotNull(timeEntries.endTime) // Only include completed time entries, not ongoing ones
      ))
      .orderBy(desc(timeEntries.createdAt))
      .limit(limit);

    return new Response(JSON.stringify({
      data: entries
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching time entries:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch time entries'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { taskId, userId, startTime, endTime, duration, notes } = body;

    // Validate required fields
    if (!taskId || !userId || !startTime || !endTime) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: taskId, userId, startTime, endTime'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the time entry
    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        taskId: parseInt(taskId),
        userId: parseInt(userId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationManual: duration || null,
        notes: notes || null,
      })
      .returning();

    // Update task status to "in-progress" if it's currently "pending"
    await db
      .update(tasks)
      .set({ status: 'in-progress' })
      .where(
        and(
          eq(tasks.id, parseInt(taskId)),
          eq(tasks.status, 'pending')
        )
      );

    return new Response(JSON.stringify({
      data: newEntry,
      message: 'Time entry created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating time entry:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create time entry'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 