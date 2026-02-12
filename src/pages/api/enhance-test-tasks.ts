import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskNotes, taskDiscussions, taskLinks, taskFiles, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

// Demo content for each task
const taskEnhancements = {
  'Design User Interface': {
    description: `Create responsive UI for customer dashboard with layout, colors, typography and components per brand`,
    
    notes: [
      {
        title: 'Design System Reference',
        content: `Reviewed design system. Key: #3B82F6, Inter font, 8px grid. Ensure consistency with component library.`,
        isPrivate: false
      },
      {
        title: 'User Research Insights',
        content: `Users prefer clean interfaces. Mobile is 60% of traffic. Quick metrics access and loading speed are critical.`,
        isPrivate: false
      }
    ],
    
    discussions: [
      {
        content: `Started wireframes for dashboard. Card-based design with clear hierarchy. Thoughts on navigation?`,
        type: 'insight'
      },
      {
        content: `Sidebar for desktop, bottom tab bar for mobile. This pattern tested well in user research.`,
        type: 'insight'
      },
      {
        content: `Added color palette options to Figma. Please review primary and secondary combinations.`,
        type: 'insight'
      }
    ],
    
    links: [
      {
        title: 'Figma Design File',
        url: 'https://www.figma.com/file/example/design-file',
        description: 'Main design file with wireframes and mockups'
      },
      {
        title: 'Design System Documentation',
        url: 'https://docs.example.com/design-system',
        description: 'Component library and design guidelines'
      },
      {
        title: 'WCAG 2.1 Guidelines',
        url: 'https://www.w3.org/WAI/WCAG21/quickref/',
        description: 'Accessibility guidelines reference'
      }
    ],
    
    files: [
      {
        filename: 'dashboard-wireframes.fig',
        filePath: '/uploads/design/dashboard-wireframes.fig',
        fileSize: 2048000,
        mimeType: 'application/figma'
      },
      {
        filename: 'user-personas.pdf',
        filePath: '/uploads/research/user-personas.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      },
      {
        filename: 'color-palette.png',
        filePath: '/uploads/design/color-palette.png',
        fileSize: 512000,
        mimeType: 'image/png'
      }
    ],
    
    status: 'in_progress',
    priority: 'high'
  },
  
  'Implement Authentication': {
    description: `Implement secure auth system with JWT, refresh tokens and MFA for user registration and login`,
    
    notes: [
      {
        title: 'Security Considerations',
        content: `Rate limit 5 attempts/15min per IP. HTTP-only cookies for refresh tokens. CSRF protection. Account lockout after 5 fails. Log all auth events.`,
        isPrivate: false
      },
      {
        title: 'Database Schema Updates',
        content: `Add to users: mfa_enabled, mfa_secret, failed_login_attempts, locked_until. Create refresh_tokens table.`,
        isPrivate: true
      }
    ],
    
    discussions: [
      {
        content: `Implementing JWT with RS256. Should we add token blacklisting for logout?`,
        type: 'insight'
      },
      {
        content: `Start with shorter token lifetimes first. Add blacklisting in next iteration. Focus on basic flow.`,
        type: 'insight'
      },
      {
        content: `Rate limiting done with express-rate-limit. Working well. Next: password reset flow.`,
        type: 'insight'
      }
    ],
    
    links: [
      {
        title: 'JWT Best Practices',
        url: 'https://tools.ietf.org/html/rfc7519',
        description: 'JWT specification and implementation guidelines'
      },
      {
        title: 'OWASP Authentication Guide',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
        description: 'Comprehensive authentication security guidelines'
      },
      {
        title: 'bcrypt Documentation',
        url: 'https://github.com/kelektiv/node.bcrypt.js',
        description: 'Password hashing library documentation'
      }
    ],
    
    files: [
      {
        filename: 'auth-flow-diagram.png',
        filePath: '/uploads/docs/auth-flow-diagram.png',
        fileSize: 768000,
        mimeType: 'image/png'
      },
      {
        filename: 'security-checklist.md',
        filePath: '/uploads/docs/security-checklist.md',
        fileSize: 25600,
        mimeType: 'text/markdown'
      },
      {
        filename: 'jwt-implementation.js',
        filePath: '/uploads/code/jwt-implementation.js',
        fileSize: 15360,
        mimeType: 'text/javascript'
      }
    ],
    
    status: 'in_progress',
    priority: 'critical'
  },
  
  'Write API Documentation': {
    description: `Create API documentation for auth, time tracking and project management with examples and error`,
    
    notes: [
      {
        title: 'API Structure Overview',
        content: `API org: auth, time-entries, tasks, projects, teams, collaborations, reports. RESTful with consistent response formats.`,
        isPrivate: false
      },
      {
        title: 'Documentation Standards',
        content: `Clear descriptions, request/response examples, error codes, curl examples. Format: { success, data, error, message }`,
        isPrivate: false
      }
    ],
    
    discussions: [
      {
        content: `Started OpenAPI spec. Swagger UI or Redoc for the docs interface?`,
        type: 'insight'
      },
      {
        content: `Swagger UI is more interactive. Basic structure set up. Please review auth section.`,
        type: 'insight'
      },
      {
        content: `Added JS, Python, curl examples. Documented error format. Working on webhooks.`,
        type: 'insight'
      }
    ],
    
    links: [
      {
        title: 'OpenAPI 3.0 Specification',
        url: 'https://swagger.io/specification/',
        description: 'Official OpenAPI specification documentation'
      },
      {
        title: 'Swagger UI Documentation',
        url: 'https://swagger.io/tools/swagger-ui/',
        description: 'Interactive API documentation tool'
      },
      {
        title: 'API Documentation Best Practices',
        url: 'https://docs.github.com/en/rest/guides/best-practices-for-rest-api-design',
        description: 'GitHub\'s REST API design guidelines'
      }
    ],
    
    files: [
      {
        filename: 'openapi-spec.yaml',
        filePath: '/uploads/docs/openapi-spec.yaml',
        fileSize: 51200,
        mimeType: 'text/yaml'
      },
      {
        filename: 'api-examples.json',
        filePath: '/uploads/docs/api-examples.json',
        fileSize: 25600,
        mimeType: 'application/json'
      },
      {
        filename: 'documentation-template.md',
        filePath: '/uploads/templates/documentation-template.md',
        fileSize: 12800,
        mimeType: 'text/markdown'
      }
    ],
    
    status: 'pending',
    priority: 'regular'
  }
};

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
    let enhancementsCount = 0;

    // Process each task enhancement
    for (const [taskName, enhancement] of Object.entries(taskEnhancements)) {
      // Find the task
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

      console.log(`Enhancing task: ${taskName} (ID: ${task.id})`);

      // Update task with enhanced description, status, and priority
      await db.update(tasks)
        .set({
          description: enhancement.description,
          status: enhancement.status,
          priority: enhancement.priority,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, task.id));

      // Add task notes
      for (const note of enhancement.notes) {
        const existingNote = await db.query.taskNotes.findFirst({
          where: and(
            eq(taskNotes.taskId, task.id),
            eq(taskNotes.userId, testUserId),
            eq(taskNotes.title, note.title)
          )
        });

        if (!existingNote) {
          await db.insert(taskNotes).values({
            taskId: task.id,
            userId: testUserId,
            title: note.title,
            content: note.content,
            isPrivate: note.isPrivate,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Add task discussions (insights)
      for (const discussion of enhancement.discussions) {
        await db.insert(taskDiscussions).values({
          taskId: task.id,
          userId: testUserId,
          content: discussion.content,
          type: discussion.type,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Add task links
      for (const link of enhancement.links) {
        const existingLink = await db.query.taskLinks.findFirst({
          where: and(
            eq(taskLinks.taskId, task.id),
            eq(taskLinks.userId, testUserId),
            eq(taskLinks.title, link.title)
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
        }
      }

      // Add task files (simulated)
      for (const file of enhancement.files) {
        const existingFile = await db.query.taskFiles.findFirst({
          where: and(
            eq(taskFiles.taskId, task.id),
            eq(taskFiles.userId, testUserId),
            eq(taskFiles.filename, file.filename)
          )
        });

        if (!existingFile) {
          await db.insert(taskFiles).values({
            taskId: task.id,
            userId: testUserId,
            filename: file.filename,
            filePath: file.filePath,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            createdAt: new Date()
          });
        }
      }

      enhancementsCount++;
      console.log(`✅ Enhanced task: ${taskName}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully enhanced ${enhancementsCount} test tasks with demo content`,
      enhancedTasks: Object.keys(taskEnhancements),
      contentAdded: {
        taskNotes: 'Task notes with technical details and insights',
        taskDiscussions: 'Team discussions and collaboration insights',
        taskLinks: 'External resources and documentation links',
        taskFiles: 'Sample file attachments (simulated)'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error enhancing test tasks:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to enhance test tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};