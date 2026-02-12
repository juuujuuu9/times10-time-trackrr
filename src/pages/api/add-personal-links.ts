import type { APIRoute } from 'astro';
import { db } from '../../db';
import { taskLinks, tasks, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

// Personal links to add to each task
const personalLinks = [
  {
    title: "Julian's GitHub Profile",
    url: 'https://github.com/juuujuuu9',
    description: 'Check out my code repositories and open source projects'
  },
  {
    title: "Julian's LinkedIn Profile", 
    url: 'https://www.linkedin.com/in/julian-hardee-creator/',
    description: 'Connect with me on LinkedIn for professional networking'
  },
  {
    title: "Julian's Personal Website",
    url: 'https://www.julianhardee.com/',
    description: 'Visit my portfolio website to learn more about my work'
  }
];

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

    const testUserId = testUser.id;
    let totalLinksAdded = 0;

    // Find the test tasks
    const testTaskNames = ['Design User Interface', 'Implement Authentication', 'Write API Documentation'];
    
    for (const taskName of testTaskNames) {
      const task = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.name, taskName),
          eq(tasks.projectId, 16) // Test Project ID
        )
      });

      if (!task) {
        console.log(`Task "${taskName}" not found, skipping...`);
        continue;
      }

      console.log(`Adding personal links to task: ${taskName} (ID: ${task.id})`);

      // Add each personal link to the task
      for (const link of personalLinks) {
        // Check if this link already exists for this task
        const existingLink = await db.query.taskLinks.findFirst({
          where: and(
            eq(taskLinks.taskId, task.id),
            eq(taskLinks.userId, testUserId),
            eq(taskLinks.url, link.url)
          )
        });

        if (!existingLink) {
          await db.insert(taskLinks).values({
            taskId: task.id,
            userId: testUserId,
            title: link.title,
            url: link.url,
            description: link.description,
            createdAt: new Date()
          });
          totalLinksAdded++;
          console.log(`✅ Added link: ${link.title}`);
        } else {
          console.log(`⏭️  Link already exists: ${link.title}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully added ${totalLinksAdded} personal links to test tasks`,
      linksAdded: totalLinksAdded,
      personalLinks: personalLinks.map(link => ({
        title: link.title,
        url: link.url,
        description: link.description
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding personal links:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add personal links',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};