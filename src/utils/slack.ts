import { WebClient } from '@slack/web-api';
import { db } from '../db';
import { slackWorkspaces, slackUsers, slackCommands } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface SlackOAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  authed_user?: {
    id: string;
    scope: string;
    access_token: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export interface SlackUserInfo {
  id: string;
  name: string;
  email?: string;
  real_name?: string;
}

// Initialize Slack Web API client
export function createSlackClient(token: string): WebClient {
  return new WebClient(token);
}

// Handle Slack OAuth installation
export async function handleSlackOAuth(code: string, clientId: string, clientSecret: string) {
  try {
    const client = new WebClient();
    const oauthResponse = await client.oauth.v2.access({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }) as SlackOAuthResponse;

    if (!oauthResponse.access_token) {
      throw new Error('Failed to get access token from Slack');
    }

    // Store workspace information
    const workspaceData = {
      workspaceId: oauthResponse.team?.id || '',
      workspaceName: oauthResponse.team?.name || '',
      accessToken: oauthResponse.access_token,
      botUserId: oauthResponse.bot_user_id,
      botAccessToken: oauthResponse.access_token, // For simplicity, using same token
    };

    // Check if workspace already exists
    const existingWorkspace = await db.query.slackWorkspaces.findFirst({
      where: eq(slackWorkspaces.workspaceId, workspaceData.workspaceId)
    });

    if (existingWorkspace) {
      // Update existing workspace
      await db.update(slackWorkspaces)
        .set({
          ...workspaceData,
          updatedAt: new Date()
        })
        .where(eq(slackWorkspaces.workspaceId, workspaceData.workspaceId));
    } else {
      // Create new workspace
      await db.insert(slackWorkspaces).values(workspaceData);
    }

    return {
      success: true,
      workspaceId: workspaceData.workspaceId,
      workspaceName: workspaceData.workspaceName
    };
  } catch (error) {
    console.error('Slack OAuth error:', error);
    throw error;
  }
}

// Link Slack user to your app user
export async function linkSlackUser(
  userId: number,
  slackUserId: string,
  workspaceId: string,
  slackUsername?: string,
  slackEmail?: string,
  accessToken?: string
) {
  try {
    // Check if user is already linked
    const existingLink = await db.query.slackUsers.findFirst({
      where: and(
        eq(slackUsers.userId, userId),
        eq(slackUsers.workspaceId, workspaceId)
      )
    });

    if (existingLink) {
      // Update existing link
      await db.update(slackUsers)
        .set({
          slackUserId,
          slackUsername,
          slackEmail,
          accessToken,
          updatedAt: new Date()
        })
        .where(eq(slackUsers.id, existingLink.id));
      
      return { success: true, updated: true };
    } else {
      // Create new link
      await db.insert(slackUsers).values({
        userId,
        slackUserId,
        workspaceId,
        slackUsername,
        slackEmail,
        accessToken
      });
      
      return { success: true, created: true };
    }
  } catch (error) {
    console.error('Error linking Slack user:', error);
    throw error;
  }
}

// Get user by Slack ID
export async function getUserBySlackId(slackUserId: string, workspaceId: string) {
  try {
    const slackUser = await db.query.slackUsers.findFirst({
      where: and(
        eq(slackUsers.slackUserId, slackUserId),
        eq(slackUsers.workspaceId, workspaceId)
      ),
      with: {
        user: true
      }
    });

    return slackUser?.user || null;
  } catch (error) {
    console.error('Error getting user by Slack ID:', error);
    return null;
  }
}

// Get workspace by ID
export async function getWorkspaceById(workspaceId: string) {
  try {
    return await db.query.slackWorkspaces.findFirst({
      where: eq(slackWorkspaces.workspaceId, workspaceId)
    });
  } catch (error) {
    console.error('Error getting workspace:', error);
    return null;
  }
}

// Log Slack command usage
export async function logSlackCommand(
  command: string,
  slackUserId: string,
  workspaceId: string,
  channelId: string,
  text?: string,
  response?: string,
  success: boolean = true
) {
  try {
    await db.insert(slackCommands).values({
      command,
      slackUserId,
      workspaceId,
      channelId,
      text,
      response,
      success
    });
  } catch (error) {
    console.error('Error logging Slack command:', error);
  }
}

// Parse time input from Slack (e.g., "2h", "1.5h", "90m")
export function parseSlackTimeInput(input: string): number {
  const trimmed = input.trim().toLowerCase();
  
  // Match patterns like "2h", "1.5h", "90m", "2 hours", "1.5 hours", "90 minutes"
  const hourMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:h|hour|hours)$/);
  const minuteMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|minute|minutes)$/);
  
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 3600); // Convert to seconds
  } else if (minuteMatch) {
    return Math.round(parseFloat(minuteMatch[1]) * 60); // Convert to seconds
  }
  
  throw new Error('Invalid time format. Use formats like "2h", "1.5h", "90m", "2 hours", etc.');
}

// Format duration for Slack response
export function formatDurationForSlack(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}
