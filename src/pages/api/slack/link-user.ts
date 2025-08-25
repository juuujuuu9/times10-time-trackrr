import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackUsers, slackWorkspaces } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { linkSlackUser, createSlackClient } from '../../../utils/slack';
import { requireAuth } from '../../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    const user = await requireAuth('/login')(context);
    const { slackUserId, workspaceId, slackUsername, slackEmail } = await context.request.json();

    if (!slackUserId || !workspaceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slack user ID and workspace ID are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify workspace exists
    const workspace = await db.query.slackWorkspaces.findFirst({
      where: eq(slackWorkspaces.workspaceId, workspaceId)
    });

    if (!workspace) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workspace not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if Slack user is already linked to another account
    const existingSlackUser = await db.query.slackUsers.findFirst({
      where: and(
        eq(slackUsers.slackUserId, slackUserId),
        eq(slackUsers.workspaceId, workspaceId)
      )
    });

    if (existingSlackUser && existingSlackUser.userId !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This Slack account is already linked to another user'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Link the user
    const result = await linkSlackUser(
      user.id,
      slackUserId,
      workspaceId,
      slackUsername,
      slackEmail
    );

    return new Response(JSON.stringify({
      success: true,
      message: result.created ? 'Slack account linked successfully' : 'Slack account updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error linking Slack user:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to link Slack account'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await requireAuth('/login')(context);
    const { workspaceId } = await context.request.json();

    if (!workspaceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workspace ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove the Slack user link
    await db.delete(slackUsers).where(
      and(
        eq(slackUsers.userId, user.id),
        eq(slackUsers.workspaceId, workspaceId)
      )
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Slack account unlinked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error unlinking Slack user:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to unlink Slack account'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
