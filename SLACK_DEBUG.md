# Slack Integration Debugging Guide

## Current Issue: "dispatch_failed" Error

When you type `/tasks` in Slack, you're getting a "dispatch_failed" error. This typically means Slack cannot reach your endpoint or there's an issue with the response.

## Debugging Steps

### 1. Verify Endpoint Accessibility

Test if your endpoint is reachable:

```bash
# Test the health endpoint
curl https://times10-time-trackrr.vercel.app/api/slack/health

# Test the commands endpoint with a POST request
curl -X POST https://times10-time-trackrr.vercel.app/api/slack/commands \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "command=/tasks&text=&user_id=test&team_id=test&channel_id=test"
```

### 2. Check Slack App Configuration

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Select your "Times10 Trackr" app
3. Go to "Slash Commands"
4. Verify the Request URL is: `https://times10-time-trackrr.vercel.app/api/slack/commands`
5. Make sure the command is installed to your workspace

### 3. Check Environment Variables

Ensure these environment variables are set in your Vercel deployment:

```env
# Database
DATABASE_URL=your_database_url

# Slack Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Site URL
SITE_URL=https://times10-time-trackrr.vercel.app
```

### 4. Test with Simple Endpoint

Try temporarily changing your Slack command URL to point to the test endpoint:

1. In Slack App settings, change the Request URL to: `https://times10-time-trackrr.vercel.app/api/slack/test`
2. Test the command in Slack
3. If this works, the issue is in the main commands endpoint

### 5. Check Database Connectivity

The main commands endpoint requires database access. Verify:

1. Your database is accessible from Vercel
2. The Slack tables exist and have data
3. There are linked users and workspaces

### 6. Common Issues and Solutions

#### Issue: Workspace not found
**Solution**: The Slack workspace needs to be installed via OAuth first.

#### Issue: User not linked
**Solution**: Users need to be linked to their Slack accounts in the admin panel.

#### Issue: Database connection failed
**Solution**: Check DATABASE_URL and ensure the database is accessible.

#### Issue: Complex queries failing
**Solution**: The simplified queries in the updated code should handle this better.

## Testing Commands

### Test Endpoint
- URL: `/api/slack/test`
- Purpose: Basic connectivity test
- Response: Simple success message

### Health Check
- URL: `/api/slack/health`
- Purpose: Database connectivity test
- Response: Health status

### Main Commands
- URL: `/api/slack/commands`
- Purpose: Handle all Slack commands
- Commands: `/track`, `/tasks`, `/time-status`

## Logs and Monitoring

Check Vercel function logs for:
- Request received logs
- Database query errors
- Response generation errors

## Next Steps

1. Test the health endpoint first
2. Test the simple test endpoint
3. Check if workspace and user data exists
4. Try the main commands endpoint
5. Check logs for specific error messages

## Manual Testing

You can manually test the database queries by:

1. Going to `/admin/slack` in your app
2. Checking if workspaces are listed
3. Checking if users are linked
4. Verifying task assignments exist
