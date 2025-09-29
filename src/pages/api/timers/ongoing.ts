import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { timeEntries, tasks, projects, users } from '../../../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { requireAuth } from '../../../utils/session';

// GET: Get user's ongoing timer
export const GET: APIRoute = async (context) => {
  try {
    const currentUser = await requireAuth()(context);
    if (!currentUser || typeof currentUser === 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's ongoing timer
    // Exclude manual duration entries (entries with durationManual but no endTime)
    const ongoingTimer = await db.select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      startTime: timeEntries.startTime,
      notes: timeEntries.notes,
      project: {
        id: projects.id,
        name: projects.name,
        clientId: projects.clientId,
        status: projects.status
      }
    })
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(and(
      eq(timeEntries.userId, currentUser.id),
      isNull(timeEntries.endTime),
      isNull(timeEntries.durationManual), // Exclude manual duration entries
      sql`${timeEntries.startTime} IS NOT NULL` // Only include entries with actual start times
    ))
    .limit(1);

    if (ongoingTimer.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: null 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timer = ongoingTimer[0];
    // Use server current time for elapsed calculation against stored timestamp
    const currentTime = new Date();
    const elapsedSeconds = Math.floor((currentTime.getTime() - new Date(timer.startTime || '').getTime()) / 1000);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: timer.id,
        projectId: timer.projectId,
        startTime: timer.startTime,
        elapsedSeconds,
        notes: timer.notes,
        project: timer.project
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting ongoing timer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Start a new timer
export const POST: APIRoute = async (context) => {
  try {
    console.log('🔍 [TIMER DEBUG] POST /api/timers/ongoing - Starting timer request');
    
    const currentUser = await requireAuth()(context);
    if (!currentUser || typeof currentUser === 'string') {
      console.log('❌ [TIMER DEBUG] Authentication failed');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [TIMER DEBUG] User authenticated:', currentUser.id);

    const body = await context.request.json();
    const { taskId, projectId, notes, clientTime } = body;
    
    // Use projectId if provided, otherwise fall back to taskId for backward compatibility
    const finalProjectId = projectId || taskId;
    
    console.log('📝 [TIMER DEBUG] Request body:', { taskId, projectId, finalProjectId, notes, clientTime });

    if (!finalProjectId) {
      console.log('❌ [TIMER DEBUG] No projectId or taskId provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Project ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has an ongoing timer
    // Exclude manual duration entries (entries with durationManual but no endTime)
    console.log('🔍 [TIMER DEBUG] Checking for existing timers for user:', currentUser.id);
    const existingTimer = await db.select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, currentUser.id),
        isNull(timeEntries.endTime),
        isNull(timeEntries.durationManual), // Exclude manual duration entries
        sql`${timeEntries.startTime} IS NOT NULL` // Only include entries with actual start times
      ));

    console.log('📊 [TIMER DEBUG] Existing timers found:', existingTimer.length);

    if (existingTimer.length > 0) {
      console.log('❌ [TIMER DEBUG] User already has ongoing timer:', existingTimer[0]);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User already has an ongoing timer' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify project exists and is assigned to user
    console.log('🔍 [TIMER DEBUG] Verifying project exists:', finalProjectId);
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, finalProjectId))
      .limit(1);

    console.log('📊 [TIMER DEBUG] Project found:', project.length > 0 ? 'Yes' : 'No');
    if (project.length > 0) {
      console.log('📝 [TIMER DEBUG] Project details:', project[0]);
    }

    if (project.length === 0) {
      console.log('❌ [TIMER DEBUG] Project not found for ID:', finalProjectId);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Project not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new ongoing timer using timezone-safe date creation
    // Get the current time from the client to preserve user's timezone
    // Use the exact client timestamp as the authoritative start time
    const startTime = clientTime ? new Date(parseInt(clientTime)) : new Date();
    
    console.log('⏰ [TIMER DEBUG] Creating timer with startTime:', startTime);
    console.log('📝 [TIMER DEBUG] Timer data:', {
      userId: currentUser.id,
      projectId: finalProjectId,
      startTime: startTime,
      notes: notes || null
    });
    
    const [newTimer] = await db.insert(timeEntries).values({
      userId: currentUser.id,
      projectId: finalProjectId,
      startTime: startTime,
      endTime: null,
      notes: notes || null
    }).returning();

    console.log('✅ [TIMER DEBUG] Timer created successfully:', newTimer);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: newTimer.id,
        projectId: newTimer.projectId,
        startTime: newTimer.startTime,
        elapsedSeconds: 0,
        notes: newTimer.notes,
        project: project[0]
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [TIMER DEBUG] Error starting timer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Stop ongoing timer
export const PUT: APIRoute = async (context) => {
  try {
    const currentUser = await requireAuth()(context);
    if (!currentUser || typeof currentUser === 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json();
    const { timerId, endTime, notes, clientTime } = body;

    if (!timerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Timer ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the ongoing timer
    // Exclude manual duration entries (entries with durationManual but no endTime)
    const ongoingTimer = await db.select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.id, timerId),
        eq(timeEntries.userId, currentUser.id),
        isNull(timeEntries.endTime),
        isNull(timeEntries.durationManual), // Exclude manual duration entries
        sql`${timeEntries.startTime} IS NOT NULL` // Only include entries with actual start times
      ))
      .limit(1);

    if (ongoingTimer.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ongoing timer not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timer = ongoingTimer[0];
    // Use the exact client timestamp as the authoritative end time when not provided
    const endTimeDate = endTime ? new Date(endTime) : (clientTime ? new Date(parseInt(clientTime)) : new Date());
    const duration = Math.floor((endTimeDate.getTime() - new Date(timer.startTime || '').getTime()) / 1000);

    // Update the timer with end time
    const [updatedTimer] = await db.update(timeEntries)
      .set({
        endTime: endTimeDate,
        notes: notes || timer.notes,
        updatedAt: new Date()
      })
      .where(eq(timeEntries.id, timerId))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedTimer.id,
        taskId: updatedTimer.taskId,
        startTime: updatedTimer.startTime,
        endTime: updatedTimer.endTime,
        duration,
        notes: updatedTimer.notes
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error stopping timer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Force stop ongoing timer without saving
export const DELETE: APIRoute = async (context) => {
  try {
    const currentUser = await requireAuth()(context);
    if (!currentUser || typeof currentUser === 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const timerId = url.searchParams.get('timerId');

    if (!timerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Timer ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the ongoing timer
    // Exclude manual duration entries (entries with durationManual but no endTime)
    const deletedTimer = await db.delete(timeEntries)
      .where(and(
        eq(timeEntries.id, parseInt(timerId)),
        eq(timeEntries.userId, currentUser.id),
        isNull(timeEntries.endTime),
        isNull(timeEntries.durationManual), // Exclude manual duration entries
        sql`${timeEntries.startTime} IS NOT NULL` // Only include entries with actual start times
      ))
      .returning();

    if (deletedTimer.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ongoing timer not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Timer stopped and deleted'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error force stopping timer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
