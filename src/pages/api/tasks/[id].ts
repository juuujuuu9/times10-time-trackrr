import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { tasks, taskAssignments, teams, teamMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '../../../utils/session';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    console.log('PUT /api/tasks/[id] - Task status update called');
    
    // Get current user
    const currentUser = await getSessionUser(context);
    console.log('Current user:', currentUser ? { id: currentUser.id, role: currentUser.role, email: currentUser.email } : 'null');
    
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized access',
        error: 'User not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = context.params;
    const body = await context.request.json();
    const { status } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Task ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!status) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Status is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid task ID format',
        error: 'Task ID must be a valid number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid status',
        error: `Status must be one of: ${validStatuses.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if task exists
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Task not found',
        error: 'Task does not exist'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has access to this task
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'developer';
    console.log('User is admin/developer:', isAdmin);
    
    // Debug: Check what teams the user is a member of
    const userTeams = await db
      .select({ teamId: teamMembers.teamId, role: teamMembers.role })
      .from(teamMembers)
      .where(eq(teamMembers.userId, currentUser.id));
    console.log('User is member of teams:', userTeams);
    
    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true;
    } else {
      // Check if user is directly assigned to this task
      const assignment = await db
        .select()
        .from(taskAssignments)
        .where(and(
          eq(taskAssignments.taskId, taskId),
          eq(taskAssignments.userId, currentUser.id)
        ))
        .limit(1);
      
      if (assignment.length > 0) {
        hasAccess = true;
        console.log('User has direct assignment to task');
      } else {
        // Check if user is a member of a team that has access to this task
        // First, get the task's team_id
        const taskData = await db
          .select({ teamId: tasks.teamId })
          .from(tasks)
          .where(eq(tasks.id, taskId))
          .limit(1);
        
        if (taskData.length > 0 && taskData[0].teamId) {
          console.log('Task has teamId:', taskData[0].teamId, 'checking team membership for user:', currentUser.id);
          // Check if user is a member of this team (lead or member role)
          const teamMembership = await db
            .select({ role: teamMembers.role })
            .from(teamMembers)
            .where(and(
              eq(teamMembers.teamId, taskData[0].teamId),
              eq(teamMembers.userId, currentUser.id)
            ))
            .limit(1);
          
          console.log('Team membership check result:', teamMembership);
          if (teamMembership.length > 0) {
            hasAccess = true;
            console.log(`User is team ${teamMembership[0].role} with access to task`);
          } else {
            console.log('User is not a member of this team');
          }
        } else {
          console.log('Task has no teamId or taskData is empty:', taskData);
          
          // If task has no teamId, check if user has team access to the project
          if (taskData.length > 0) {
            console.log('Checking if user has team access to project...');
            const { timeEntries } = await import('../../../db/schema');
            
            // Get the project ID for this task
            const taskProject = await db
              .select({ projectId: tasks.projectId })
              .from(tasks)
              .where(eq(tasks.id, taskId))
              .limit(1);
            
            if (taskProject.length > 0) {
              console.log('Task project ID:', taskProject[0].projectId);
              
              // Check if user is a member of any team that has access to this project
              const projectTeamAccess = await db
                .select({ teamId: teams.id, teamName: teams.name, userRole: teamMembers.role })
                .from(teams)
                .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
                .where(and(
                  eq(teams.projectId, taskProject[0].projectId),
                  eq(teamMembers.userId, currentUser.id)
                ))
                .limit(1);
              
              console.log('Project team access check:', projectTeamAccess);
              if (projectTeamAccess.length > 0) {
                hasAccess = true;
                console.log(`User has team access to project via team ${projectTeamAccess[0].teamId} as ${projectTeamAccess[0].userRole}`);
              }
            }
          }
        }
        
        // If still no access, check if user has time entries for the project this task belongs to
        if (!hasAccess) {
          console.log('Checking if user has time entries for project...');
          const { timeEntries } = await import('../../../db/schema');
          
          // Get the project ID for this task
          const taskProject = await db
            .select({ projectId: tasks.projectId })
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);
          
          if (taskProject.length > 0) {
            const timeEntry = await db
              .select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.projectId, taskProject[0].projectId),
                eq(timeEntries.userId, currentUser.id)
              ))
              .limit(1);
            
            if (timeEntry.length > 0) {
              hasAccess = true;
              console.log('User has time entries for project, granting access');
            } else {
              console.log('No time entries found for user and project');
            }
          }
        }
      }
    }

    console.log('Final access decision:', hasAccess);
    if (!hasAccess) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Access denied',
        error: 'You do not have permission to update this task'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the task status
    const updatedTask = await db
      .update(tasks)
      .set({ 
        status: status,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, taskId))
      .returning();

    console.log('Task status updated successfully:', updatedTask[0]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
