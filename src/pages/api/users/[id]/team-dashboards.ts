import type { APIRoute } from 'astro';
import { getUserTeamDashboards } from '../../../utils/teamAccess';
import { getSessionUser } from '../../../utils/session';

// GET /api/users/[id]/team-dashboards - Get team dashboards for a user
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

    const userId = parseInt(params.id!);
    
    if (!userId || isNaN(userId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid user ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is requesting their own data or is admin
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team dashboards for the user
    const teamDashboards = await getUserTeamDashboards(userId);

    return new Response(JSON.stringify({
      success: true,
      data: teamDashboards
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching user team dashboards:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team dashboards'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
