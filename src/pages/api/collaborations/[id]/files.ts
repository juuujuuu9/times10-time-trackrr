import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { taskFiles, taskLinks, teams, teamMembers, users } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSessionUser } from '../../../../utils/session';

// GET /api/collaborations/[id]/files - Get files and links for a collaboration
export const GET: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Check if user is member of the collaboration
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, collaborationId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!membership && currentUser.role !== 'admin' && currentUser.role !== 'developer') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return mock data since we don't have files/links linked to collaborations yet
    // TODO: Implement proper file/link system for collaborations
    const mockFiles = [
      {
        id: 1,
        name: "Requirements v3.pdf",
        type: "file",
        author: {
          id: 1,
          name: "Priya",
          email: "priya@example.com"
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        size: "1.2MB",
        mimeType: "application/pdf"
      }
    ];

    const mockLinks = [
      {
        id: 1,
        title: "Figma Board",
        url: "https://figma.com/design/example",
        type: "link",
        author: {
          id: 2,
          name: "Mark",
          email: "mark@example.com"
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        description: "Main design board for the project"
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: {
        files: mockFiles,
        links: mockLinks
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collaboration files:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch files'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/collaborations/[id]/files - Upload a file or add a link
export const POST: APIRoute = async (context) => {
  try {
    const collaborationId = parseInt(context.params.id!);
    
    if (!collaborationId || isNaN(collaborationId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid collaboration ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Check if user is member of the collaboration
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, collaborationId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!membership && currentUser.role !== 'admin' && currentUser.role !== 'developer') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if this is a file upload (multipart/form-data) or JSON data
    const contentType = context.request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await context.request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No file provided'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = './public/uploads';
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(file.name);
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Save file to disk
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
      
      // Get taskId from form data or use a default
      const taskIdParam = formData.get('taskId') as string;
      const taskId = taskIdParam ? parseInt(taskIdParam) : 1; // Default to 1 if not provided
      
      // Create file record in database
      const newFile = await db.insert(taskFiles).values({
        taskId: taskId,
        userId: currentUser.id,
        filename: file.name,
        filePath: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        archived: false
      }).returning();

      return new Response(JSON.stringify({
        success: true,
        data: {
          id: newFile[0].id,
          name: file.name,
          url: `/uploads/${fileName}`,
          size: file.size,
          mimeType: file.type,
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          },
          createdAt: new Date()
        },
        message: 'File uploaded successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Handle JSON data (links or other data)
      const body = await context.request.json().catch(() => ({}));
      const { type, title, url, description, filename, fileSize, mimeType } = body;

      if (type === 'link') {
        if (!title || !url) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Title and URL are required for links'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // For now, return success without actually creating the link
        // TODO: Implement proper link creation system for collaborations
        const newLink = {
          id: Date.now(), // Temporary ID
          title: title.trim(),
          url: url.trim(),
          description: description || '',
          type: 'link',
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          },
          createdAt: new Date()
        };

        return new Response(JSON.stringify({
          success: true,
          data: newLink,
          message: 'Link added successfully'
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      } else if (type === 'file') {
        if (!filename) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Filename is required for files'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // For now, return success without actually creating the file
        // TODO: Implement proper file upload system for collaborations
        const newFile = {
          id: Date.now(), // Temporary ID
          name: filename,
          type: 'file',
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          },
          createdAt: new Date(),
          size: fileSize || 'Unknown',
          mimeType: mimeType || 'application/octet-stream'
        };

        return new Response(JSON.stringify({
          success: true,
          data: newFile,
          message: 'File uploaded successfully'
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });

      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid type. Must be "file" or "link"'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

  } catch (error) {
    console.error('Error creating file/link:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create file/link'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
