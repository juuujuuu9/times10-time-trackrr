import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the test user ID (the user with email user@example.com)
    const testUser = await db.query.users.findFirst({
      where: eq(users.email, 'user@example.com')
    });

    if (!testUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Test user not found. Please run /api/setup-test-user first.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const testTaskNames = ['Design User Interface', 'Implement Authentication', 'Write API Documentation'];
    const dueDates = [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    ];

    let updatedTasks = 0;

    for (let i = 0; i < testTaskNames.length; i++) {
      const taskName = testTaskNames[i];
      const dueDate = dueDates[i];

      const task = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.name, taskName),
          eq(tasks.projectId, 16) // Test Project ID
        )
      });

      if (task) {
        await db.update(tasks)
          .set({
            dueDate: dueDate,
            updatedAt: new Date()
          })
          .where(eq(tasks.id, task.id));
        
        updatedTasks++;
        console.log(`✅ Added due date to task: ${taskName} (${dueDate.toLocaleDateString()})`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully added due dates to ${updatedTasks} test tasks`,
      updatedTasks: updatedTasks,
      dueDates: testTaskNames.map((name, i) => ({
        task: name,
        dueDate: dueDates[i].toLocaleDateString()
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding due dates:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add due dates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};