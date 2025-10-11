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

    // Get files and links for this collaboration
    // Using taskFiles and taskLinks tables for now
    const files = await db.query.taskFiles.findMany({
      where: eq(taskFiles.taskId, collaborationId), // Using taskId as collaborationId for now
      with: {
        author: true
      },
      orderBy: [desc(taskFiles.createdAt)]
    });

    const links = await db.query.taskLinks.findMany({
      where: eq(taskLinks.taskId, collaborationId), // Using taskId as collaborationId for now
      with: {
        author: true
      },
      orderBy: [desc(taskLinks.createdAt)]
    });

    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.filename,
      type: "file",
      author: {
        id: file.author.id,
        name: file.author.name,
        email: file.author.email
      },
      createdAt: file.createdAt,
      size: file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)}MB` : 'Unknown',
      mimeType: file.mimeType || 'application/octet-stream'
    }));

    const formattedLinks = links.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      type: "link",
      author: {
        id: link.author.id,
        name: link.author.name,
        email: link.author.email
      },
      createdAt: link.createdAt,
      description: link.description || ''
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        files: formattedFiles,
        links: formattedLinks
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

      // Create the link in the database
      const newLink = await db.insert(taskLinks).values({
        taskId: collaborationId, // Using taskId as collaborationId for now
        authorId: currentUser.id,
        title: title.trim(),
        url: url.trim(),
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const createdLink = newLink[0];

      return new Response(JSON.stringify({
        success: true,
        data: {
          id: createdLink.id,
          title: createdLink.title,
          url: createdLink.url,
          description: createdLink.description,
          type: 'link',
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          },
          createdAt: createdLink.createdAt
        },
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

      // Create the file record in the database
      const newFile = await db.insert(taskFiles).values({
        taskId: collaborationId, // Using taskId as collaborationId for now
        authorId: currentUser.id,
        filename: filename,
        fileSize: fileSize ? parseInt(fileSize.toString()) : null,
        mimeType: mimeType || 'application/octet-stream',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const createdFile = newFile[0];

      return new Response(JSON.stringify({
        success: true,
        data: {
          id: createdFile.id,
          name: createdFile.filename,
          type: 'file',
          author: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          },
          createdAt: createdFile.createdAt,
          size: createdFile.fileSize ? `${(createdFile.fileSize / 1024 / 1024).toFixed(1)}MB` : 'Unknown',
          mimeType: createdFile.mimeType
        },
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
