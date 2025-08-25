# Slack Integration Setup Guide

This guide will help you set up Slack integration for your Times10 Time Tracker application.

## Prerequisites

1. A Slack workspace where you have admin permissions
2. Your Times10 Time Tracker application deployed and accessible via HTTPS
3. Environment variables configured

## Step 1: Create a Slack App

1. Go to [Slack API Apps page](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Enter app name: `Times10 Time Tracker`
5. Select your workspace
6. Click "Create App"

## Step 2: Configure OAuth & Permissions

1. In your Slack app dashboard, go to "OAuth & Permissions" in the left sidebar
2. Under "Scopes", add the following Bot Token Scopes:
   - `commands` - Add slash commands to your app
   - `chat:write` - Send messages as your app
   - `users:read` - View people in your workspace
   - `users:read.email` - View email addresses of people in your workspace

3. Under "Redirect URLs", add:
   ```
   https://your-domain.com/api/slack/oauth
   ```
   (Replace `your-domain.com` with your actual domain)

4. Save the changes

## Step 3: Configure Slash Commands

1. Go to "Slash Commands" in the left sidebar
2. Click "Create New Command"
3. Create the following commands:

### /track command
- **Command**: `/track`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Record time for a task`
- **Usage Hint**: `task_id duration [notes]`

### /tasks command
- **Command**: `/tasks`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `View your assigned tasks`
- **Usage Hint**: `(no parameters needed)`

### /status command
- **Command**: `/status`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `View today's time tracking summary`
- **Usage Hint**: `(no parameters needed)`

## Step 4: Get App Credentials

1. Go to "Basic Information" in the left sidebar
2. Copy the following values:
   - **Client ID** (under "App Credentials")
   - **Client Secret** (under "App Credentials")
   - **Signing Secret** (under "App Credentials")

## Step 5: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Slack Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
SITE_URL=https://your-domain.com
```

## Step 6: Install the App

1. Go to "Install App" in the left sidebar
2. Click "Install to Workspace"
3. Review the permissions and click "Allow"
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## Step 7: Deploy and Test

1. Deploy your application with the new environment variables
2. Run the database migration:
   ```bash
   npm run db:push
   ```

3. Go to your admin dashboard: `https://your-domain.com/admin/slack`
4. Click "Add to Slack" to install the app
5. Test the commands in your Slack workspace

## Usage Instructions

### For Admins

1. **Install the Slack App**:
   - Go to `/admin/slack` in your Times10 dashboard
   - Click "Add to Slack"
   - Follow the OAuth flow

2. **Monitor Integration**:
   - View connected workspaces and users
   - Check command usage logs
   - Manage user linking

### For Team Members

1. **Link Your Slack Account**:
   - The admin needs to link your Slack account to your Times10 account
   - This is typically done during the initial setup

2. **Use Slack Commands**:
   - `/track 123 2h Working on feature` - Record 2 hours for task 123
   - `/tasks` - View your assigned tasks
   - `/status` - View today's time tracking summary

## Command Examples

### Time Tracking
```
/track 123 2h Working on user authentication
/track 456 90m Bug fixes and testing
/track 789 1.5h Code review and documentation
```

### View Tasks
```
/tasks
```
Returns a list of your assigned tasks with IDs.

### Check Status
```
/status
```
Shows today's time tracking summary.

## Troubleshooting

### Common Issues

1. **"Workspace not found" error**:
   - Ensure the Slack app is properly installed to your workspace
   - Check that the workspace is connected in your admin dashboard

2. **"User not linked" error**:
   - The user's Slack account needs to be linked to their Times10 account
   - Contact your admin to link the accounts

3. **Commands not working**:
   - Verify the request URLs are correct and accessible
   - Check that your app has the required permissions
   - Ensure your application is accessible via HTTPS

4. **OAuth errors**:
   - Verify your Client ID and Client Secret are correct
   - Check that your redirect URL matches exactly
   - Ensure your domain is accessible

### Debugging

1. Check the Slack app logs in your Slack workspace
2. Monitor your application logs for errors
3. Verify environment variables are set correctly
4. Test the OAuth flow manually

## Security Considerations

1. **Environment Variables**: Keep your Slack credentials secure and never commit them to version control
2. **HTTPS**: Always use HTTPS in production for secure OAuth flows
3. **Permissions**: Only request the minimum required permissions for your app
4. **Token Storage**: Access tokens are encrypted and stored securely in the database

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review your Slack app configuration
3. Verify your environment variables
4. Check your application logs for errors
5. Ensure your database migration ran successfully

For additional help, refer to the [Slack API documentation](https://api.slack.com/) or contact your system administrator.
