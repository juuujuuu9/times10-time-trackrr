import type { APIRoute } from 'astro';
import { db } from '../../db';
import { tasks, taskNotes, taskDiscussions, taskLinks, taskFiles, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../utils/session';

// Demo content for each task
const taskEnhancements = {
  'Design User Interface': {
    description: `Create a modern, responsive user interface for the new customer dashboard. This includes designing the layout, color scheme, typography, and interactive components. The design should follow our brand guidelines and provide an intuitive user experience across desktop and mobile devices.

**Key Requirements:**
- Responsive design for desktop, tablet, and mobile
- Accessibility compliance (WCAG 2.1 AA)
- Dark mode support
- Consistent with existing design system
- User testing feedback integration`,
    
    notes: [
      {
        title: 'Design System Reference',
        content: `Reviewed the current design system documentation. Key components to focus on:
- Primary color: #3B82F6 (blue-500)
- Typography: Inter font family
- Spacing: 8px grid system
- Border radius: 4px, 8px, 16px scale

Need to ensure consistency with existing components in the component library.`,
        isPrivate: false
      },
      {
        title: 'User Research Insights',
        content: `Based on recent user interviews:
- Users prefer clean, minimalist interfaces
- Quick access to key metrics is essential
- Mobile usage is 60% of total traffic
- Loading speed is critical for user retention

These insights should guide our design decisions.`,
        isPrivate: false
      }
    ],
    
    discussions: [
      {
        content: `Started working on the wireframes for the dashboard layout. Thinking of a card-based design with clear visual hierarchy. What are your thoughts on the navigation structure?`,
        type: 'insight'
      },
      {
        content: `Great progress on the wireframes! I suggest we use a sidebar navigation for desktop and a bottom tab bar for mobile. This pattern tested well in our previous user research.`,
        type: 'insight'
      },
      {
        content: `Added initial color palette options to Figma. Please review and provide feedback on the primary and secondary color combinations.`,
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
    description: `Implement secure authentication system with JWT tokens, refresh tokens, and multi-factor authentication support. The system should handle user registration, login, password reset, and session management while maintaining high security standards.

**Technical Requirements:**
- JWT access tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- bcrypt password hashing with salt rounds
- Rate limiting on authentication endpoints
- Multi-factor authentication (MFA) support
- OAuth 2.0 integration ready`,
    
    notes: [
      {
        title: 'Security Considerations',
        content: `Key security requirements identified:
- Implement rate limiting: 5 attempts per 15 minutes per IP
- Use secure HTTP-only cookies for refresh tokens
- Implement CSRF protection for state-changing operations
- Add account lockout after 5 failed attempts
- Log all authentication events for security monitoring

Reference: OWASP Authentication Cheat Sheet`,
        isPrivate: false
      },
      {
        title: 'Database Schema Updates',
        content: `Need to add the following fields to users table:
- mfa_enabled (boolean)
- mfa_secret (varchar)
- failed_login_attempts (integer)
- locked_until (timestamp)
- password_changed_at (timestamp)

Also need to create refresh_tokens table for better token management.`,
        isPrivate: true
      }
    ],
    
    discussions: [
      {
        content: `Started implementing the JWT token generation. Using RS256 algorithm for better security. Should we also implement token blacklisting for logout functionality?`,
        type: 'insight'
      },
      {
        content: `Token blacklisting would be good for security, but let's start with shorter token lifetimes first. We can add blacklisting in the next iteration. Focus on getting the basic flow working reliably.`,
        type: 'insight'
      },
      {
        content: `Rate limiting is now implemented using express-rate-limit. Testing with different scenarios - seems to be working well. Next up: password reset flow.`,
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
    description: `Create comprehensive API documentation for all endpoints including authentication, time tracking, project management, and team collaboration features. The documentation should be developer-friendly with clear examples, request/response schemas, and error handling guidelines.

**Documentation Requirements:**
- OpenAPI 3.0 specification
- Interactive API explorer (Swagger UI)
- Code examples in multiple languages
- Authentication flow documentation
- Rate limiting and error code explanations
- Webhook event documentation`,
    
    notes: [
      {
        title: 'API Structure Overview',
        content: `API Organization:
- /api/auth/* - Authentication endpoints
- /api/time-entries/* - Time tracking
- /api/tasks/* - Task management
- /api/projects/* - Project operations
- /api/teams/* - Team collaboration
- /api/collaborations/* - Collaborative features
- /api/reports/* - Analytics and reporting

Each endpoint follows RESTful conventions with consistent response formats.`,
        isPrivate: false
      },
      {
        title: 'Documentation Standards',
        content: `Documentation guidelines:
- Use clear, concise descriptions
- Include request/response examples
- Document all error codes and scenarios
- Provide curl examples for each endpoint
- Include rate limiting information
- Add deprecation notices where applicable

Follow the existing API response format: { success, data, error, message }`,
        isPrivate: false
      }
    ],
    
    discussions: [
      {
        content: `Started with the OpenAPI specification. Defining the basic structure and components. Should we use Swagger UI or Redoc for the documentation interface?`,
        type: 'insight'
      },
      {
        content: `Swagger UI is more interactive and familiar to developers. Let's go with that. I've set up the basic structure - please review the authentication section when you have a chance.`,
        type: 'insight'
      },
      {
        content: `Added code examples for JavaScript, Python, and curl. Also documented the error response format. Working on the webhook section now.`,
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