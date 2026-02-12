# Testing Guide - Times10 Time Tracker

## Quick Start - Test Login

**Ready-to-use test credentials:**
- **Email**: `user@example.com`
- **Password**: `user`
- **URL**: http://localhost:4321/login

## Setting Up Test Data

If you need fresh test data, run:
```bash
curl -X POST http://localhost:4321/api/setup-test-user
```

This automatically creates:
- ✅ Test user with regular team member access
- ✅ Test team and collaboration
- ✅ 3 assigned tasks for time tracking
- ✅ Complete project/client structure

## What You Can Test

### 🔐 Authentication & User Management
- **Login/Logout**: Use the test credentials above
- **Session Management**: Automatic 7-day sessions with HTTP-only cookies
- **Role-based Access**: Test user has regular member permissions (not admin)

### ⏱️ Time Tracking Features
- **Start/Stop Timers**: Click on any assigned task to start timing
- **Manual Time Entry**: Add duration manually for completed work
- **Time Entry History**: View all logged time with project details
- **Multiple Tasks**: Switch between the 3 test tasks seamlessly

### 👥 Team Collaboration
- **Team Access**: View "Test Team" collaboration details
- **Task Assignments**: See assigned tasks in your dashboard
- **Insights (Discussions)**: Participate in task conversations
- **File Sharing**: Upload and share files within team context
- **Team Notes**: Add and view collaborative notes

### 📊 Dashboard & Reporting
- **Personal Dashboard**: View your time tracking summary
- **Task Progress**: See status of assigned tasks
- **Project Overview**: View time spent on Test Project
- **Team Performance**: See collaboration metrics

### 📋 Task Management
- **Task List**: View all assigned tasks with details
- **Task Status**: Update task progress (pending → in_progress → completed)
- **Task Details**: View descriptions, due dates, priorities
- **Task Notes**: Add personal or shared notes to tasks

## Test User Permissions

The test user (`user@example.com`) has **regular team member** access:

✅ **Can Do:**
- Login and access personal dashboard
- Track time on assigned tasks
- View team collaborations they're part of
- Participate in discussions (Insights)
- Upload files to team tasks
- View team members and basic team info
- Access personal reports and time history

❌ **Cannot Do:** (requires admin/manager role)
- Create new teams or projects
- Manage team members or assign roles
- Access admin dashboards
- View financial/cost data
- Manage other users' tasks
- System administration features

## Testing Workflows

### 1. Daily Time Tracking Workflow
1. Login with test credentials
2. Start timer on "Design User Interface" task
3. Work for 30 minutes, stop timer
4. Add manual entry for "Implement Authentication" (1 hour)
5. View time entries in dashboard

### 2. Team Collaboration Workflow
1. Access "Test Team" collaboration
2. View assigned tasks
3. Add an Insight (discussion) to a task
4. Upload a relevant file
5. View team activity feed

### 3. Task Management Workflow
1. View task list
2. Update task status from pending to in_progress
3. Add task notes with progress updates
4. Set task priorities
5. View task time tracking history

## API Endpoints to Test

**Authentication:**
```bash
# Login
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user"}'
```

**Team Features:**
```bash
# Get user's teams
curl -X GET "http://localhost:4321/api/teams" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"

# Get collaborations
curl -X GET "http://localhost:4321/api/collaborations" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"
```

**Task Management:**
```bash
# Get assigned tasks
curl -X GET "http://localhost:4321/api/tasks?assignedTo=11" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"
```

**Time Tracking:**
```bash
# Get time entries
curl -X GET "http://localhost:4321/api/time-entries?userId=11" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"
```

## Troubleshooting

### Login Issues
- **Wrong credentials**: Use `user@example.com` / `user`
- **Session expired**: Re-run the setup command to refresh session
- **Server not running**: Start with `npm run dev`

### Missing Test Data
- Run `curl -X POST http://localhost:4321/api/setup-test-user` to recreate everything
- Check server logs for any setup errors
- Verify database connection is working

### Permission Errors
- Test user has regular member permissions only
- For admin features, you'll need to create an admin user
- Some features require team lead or admin role

## Next Steps

After testing with the regular user:

1. **Test Admin Features**: Create an admin user to test management features
2. **Test Team Creation**: Have an admin create additional teams
3. **Test Integrations**: Try Slack integration if configured
4. **Test Reports**: Generate time reports and analytics
5. **Test Mobile**: Try the responsive design on mobile devices

## Need Help?

- Check the main README.md for setup instructions
- Review API documentation in `/src/pages/api/`
- Look at database schema in `/src/db/schema.ts`
- Check the test user setup script at `/src/pages/api/setup-test-user.ts`

Happy testing! 🎉