import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { teams, teamMembers, users } from '../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

// GET /api/teams/[id]/files - Get team files
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a member of the team
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team files (for now, we'll use a simple approach)
    // In a real implementation, you'd have a team_files table
    const files = await db
      .select({
        id: sql`ROW_NUMBER() OVER (ORDER BY ${users.createdAt})`.as('id'),
        userId: users.id,
        userName: users.name,
        filename: sql`'sample-file.txt'`.as('filename'),
        filePath: sql`'/uploads/sample-file.txt'`.as('filePath'),
        fileSize: sql`1024`.as('fileSize'),
        mimeType: sql`'text/plain'`.as('mimeType'),
        createdAt: sql`NOW()`.as('createdAt')
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .limit(50);

    return new Response(JSON.stringify({
      success: true,
      data: files
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team files:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team files'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/teams/[id]/files - Upload a team file
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teamId = parseInt(params.id!);
    
    if (!teamId || isNaN(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid team ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a member of the team
    const teamMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, currentUser.id)
      )
    });

    if (!teamMembership) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
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

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File size must be less than 10MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, we'll simulate file upload
    // In a real implementation, you'd save the file and insert into team_files table
    const newFile = {
      id: Date.now(), // Simulate ID
      userId: currentUser.id,
      userName: currentUser.name,
      filename: file.name,
      filePath: `/uploads/teams/${teamId}/${file.name}`,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date()
    };

    return new Response(JSON.stringify({
      success: true,
      data: newFile,
      message: 'File uploaded successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error uploading team file:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
