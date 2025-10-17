# Email Notifications Guide

This guide explains the email notification system for Times10 Time Tracker, including collaboration, task, and subtask assignment notifications.

## Overview

The application now sends automatic email notifications when users are:
- Added to a collaboration (team)
- Assigned to a task
- Assigned to a subtask

## Notification Types

### 1. Collaboration Assignment Notifications

**Triggered when:** A user is added to a collaboration/team
**API Endpoint:** `POST /api/admin/teams/[id]/members`
**Email Function:** `sendCollaborationAssignmentEmail()`

**Email includes:**
- Collaboration name
- Project name
- Who added the user
- Collaboration description (if available)
- Link to view the collaboration

### 2. Task Assignment Notifications

**Triggered when:** A user is assigned to a task
**API Endpoint:** `POST /api/admin/tasks/assign`
**Email Function:** `sendTaskAssignmentEmail()`

**Email includes:**
- Task name
- Project name
- Who assigned the task
- Task description (if available)
- Link to view the task in dashboard

### 3. Subtask Assignment Notifications

**Triggered when:** A user is assigned to a subtask
**API Endpoint:** `PUT /api/admin/tasks/[id]/subtasks/[subtaskId]`
**Email Function:** `sendSubtaskAssignmentEmail()`

**Email includes:**
- Subtask name
- Parent task name
- Project name
- Who assigned the subtask
- Subtask description (if available)
- Link to view the subtask

## Testing Notifications

Use the test endpoint to verify notifications work:

```bash
# Test collaboration notification
curl -X POST http://localhost:4321/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType": "collaboration", "email": "test@example.com"}'

# Test task notification
curl -X POST http://localhost:4321/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType": "task", "email": "test@example.com"}'

# Test subtask notification
curl -X POST http://localhost:4321/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType": "subtask", "email": "test@example.com"}'

# Test all notification types
curl -X POST http://localhost:4321/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType": "all", "email": "test@example.com"}'
```

## Email Configuration

The notifications use the existing email infrastructure:
- **Service:** Resend
- **Configuration:** `src/utils/emailConfig.ts`
- **Base URL:** Configured via `getEmailBaseUrl()`

## Implementation Details

### Email Templates

All notification emails use consistent styling:
- Brand colors (#d63a2e)
- Responsive design
- Dark mode support
- Mobile-friendly layout

### Error Handling

- Email failures don't break the main operation
- Detailed logging for debugging
- Graceful fallbacks when email service is unavailable

### Security

- Only sends emails to users with valid email addresses
- Skips sending emails to the person performing the action
- Validates user permissions before sending notifications

## Database Schema

The notifications use existing database tables:
- `teams` - for collaborations
- `tasks` - for tasks
- `taskDiscussions` - for subtasks (stored as JSON in `subtaskData`)
- `users` - for user information

## Troubleshooting

### Common Issues

1. **No emails being sent:**
   - Check `RESEND_API_KEY` environment variable
   - Verify domain configuration in Resend dashboard
   - Check console logs for error messages

2. **Emails going to spam:**
   - Configure SPF, DKIM, and DMARC records
   - Use a verified domain in Resend
   - Consider using a dedicated email service

3. **Missing user information:**
   - Ensure users have valid email addresses
   - Check that user names match exactly in the database

### Debug Mode

When `RESEND_API_KEY` is not configured, the system logs email details to console instead of sending actual emails. This is useful for development and testing.

## Future Enhancements

Potential improvements to consider:
- Email preferences per user
- Notification frequency settings
- Digest emails for multiple assignments
- SMS notifications for urgent assignments
- Push notifications for mobile users
