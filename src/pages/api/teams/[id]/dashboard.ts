import type { APIRoute } from 'astro';
import { TeamDashboardService } from '../../../services/TeamDashboardService';
import { getSessionUser } from '../../../utils/session';

// GET /api/teams/[id]/dashboard - Get team dashboard data
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

    // Get query parameters for date filtering
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    }
    if (endDateParam) {
      endDate = new Date(endDateParam);
    }

    // Get team dashboard data
    const teamDashboard = await TeamDashboardService.getTeamDashboard(
      teamId, 
      currentUser.id, 
      startDate, 
      endDate
    );

    if (!teamDashboard) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Team not found or access denied'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: teamDashboard
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching team dashboard:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch team dashboard'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
