# Comprehensive Slack Integration Debugging Guide

## Current Issue: "dispatch_failed" Error

The `/tasks` command is returning a "dispatch_failed" error. This comprehensive guide will help you identify and fix the issue.

## Step-by-Step Debugging Process

### 1. Test Basic Connectivity

First, test if your endpoints are reachable:

```bash
# Test health endpoint
curl -X GET https://times10-time-trackrr.vercel.app/api/slack/health

# Test simple endpoint
curl -X POST https://times10-time-trackrr.vercel.app/api/slack/simple-test \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "command=/tasks&text=&user_id=U08E4098M54&team_id=T13JYJDLH&channel_id=test"
```

### 2. Check Slack App Configuration

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Select your "Times10 Trackr" app
3. Go to "Slash Commands"
4. Verify the Request URL for `/tasks` is: `https://times10-time-trackrr.vercel.app/api/slack/commands`
5. Make sure the command is installed to your workspace

### 3. Test with Debug Endpoints

I've created several debug endpoints to help identify the issue:

#### Test Debug Endpoint
- URL: `/api/slack/debug`
- Purpose: Comprehensive testing of all components
- Use this to test the exact same data that `/tasks` would receive

#### Test Tasks Endpoint
- URL: `/api/slack/test-tasks`
- Purpose: Test the specific task lookup functionality
- This isolates the task-related database queries

#### Simple Test Endpoint
- URL: `/api/slack/simple-test`
- Purpose: Basic connectivity test without database dependencies

### 4. Check Environment Variables

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

### 5. Verify Database State

Check the current state of your Slack integration:

```bash
# Check Slack integration status
curl -X GET https://times10-time-trackrr.vercel.app/api/slack/status
```

This will show:
- Number of connected workspaces
- Number of linked users
- Details about each workspace and user

### 6. Test Specific User and Workspace

Based on the status endpoint, we know:
- Workspace ID: `T13JYJDLH`
- User ID: `U08E4098M54`

Test the specific user's task assignments:

```bash
curl -X POST https://times10-time-trackrr.vercel.app/api/slack/test-tasks \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "user_id=U08E4098M54&team_id=T13JYJDLH"
```

### 7. Common Issues and Solutions

#### Issue: Workspace not found
**Symptoms**: Debug endpoint shows "Workspace: ❌ Not found"
**Solution**: The Slack workspace needs to be installed via OAuth first.

#### Issue: User not linked
**Symptoms**: Debug endpoint shows "User Linked: ❌ No"
**Solution**: Users need to be linked to their Slack accounts in the admin panel.

#### Issue: No task assignments
**Symptoms**: Debug endpoint shows "Task Assignments: 0"
**Solution**: The user needs to be assigned to tasks in the admin panel.

#### Issue: Database connection failed
**Symptoms**: Debug endpoint shows "Database: ❌ Failed"
**Solution**: Check DATABASE_URL and ensure the database is accessible.

#### Issue: Complex queries failing
**Symptoms**: User linked but tasks query fails
**Solution**: The improved error handling in the updated code should handle this better.

### 8. Manual Testing Steps

1. **Test Basic Endpoint**: Use `/api/slack/simple-test` to verify basic connectivity
2. **Test Debug Endpoint**: Use `/api/slack/debug` to test all components
3. **Test Tasks Endpoint**: Use `/api/slack/test-tasks` to test task functionality
4. **Check Admin Panel**: Go to `/admin/slack` to verify workspace and user data
5. **Check Task Assignments**: Verify the user has assigned tasks in the admin panel

### 9. Slack App Verification

1. **Check App Installation**: Ensure the app is installed to your workspace
2. **Check Command Permissions**: Verify the app has the necessary scopes
3. **Check Request URL**: Ensure the URL is correct and accessible
4. **Check App Status**: Make sure the app is not in development mode if testing in production

### 10. Vercel Deployment Check

1. **Check Function Logs**: Look at Vercel function logs for errors
2. **Check Environment Variables**: Verify all required env vars are set
3. **Check Function Timeout**: Ensure the function doesn't timeout (should be under 10 seconds)
4. **Check Cold Start**: The first request might be slow due to cold start

## Next Steps

1. Run the debug endpoints to identify the specific issue
2. Check the Vercel function logs for detailed error messages
3. Verify the Slack app configuration
4. Test with the specific user and workspace IDs
5. Check if the user has any task assignments

## Expected Results

If everything is working correctly:
- Health endpoint: `{"status":"healthy","database":"connected"}`
- Status endpoint: Should show 1 workspace and 1 linked user
- Debug endpoint: Should show all green checkmarks
- Tasks endpoint: Should show the user's task assignments

## Troubleshooting Commands

```bash
# Test all endpoints
curl -X GET https://times10-time-trackrr.vercel.app/api/slack/health
curl -X GET https://times10-time-trackrr.vercel.app/api/slack/status
curl -X POST https://times10-time-trackrr.vercel.app/api/slack/debug -H "Content-Type: application/x-www-form-urlencoded" -d "user_id=U08E4098M54&team_id=T13JYJDLH"
curl -X POST https://times10-time-trackrr.vercel.app/api/slack/test-tasks -H "Content-Type: application/x-www-form-urlencoded" -d "user_id=U08E4098M54&team_id=T13JYJDLH"
```

Run these commands and check the results to identify where the issue is occurring.
