import type { APIRoute } from 'astro';
import { getSessionUser } from '../../utils/session';
import { NotificationService } from '../../services/notificationService';

// GET /api/notifications - Get notifications for current user
export const GET: APIRoute = async (context) => {
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

    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const notifications = await NotificationService.getUserNotifications(currentUser.id, limit);

    return new Response(JSON.stringify({
      success: true,
      data: notifications
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch notifications'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/notifications - Mark notification as read
export const PUT: APIRoute = async (context) => {
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

    const body = await context.request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      await NotificationService.markAllAsRead(currentUser.id);
    } else if (notificationId) {
      await NotificationService.markAsRead(notificationId);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: markAll ? 'All notifications marked as read' : 'Notification marked as read'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update notification'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
