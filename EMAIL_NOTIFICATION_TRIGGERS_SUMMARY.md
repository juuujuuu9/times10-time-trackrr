# Email Notification Triggers - Implementation Summary

This document provides a comprehensive overview of all email notification triggers implemented in the Times10 Time Tracker system.

## ✅ Implemented Notification Triggers

### 1. Collaboration Assignment Notifications
**Trigger**: When a user is added to a collaboration/team  
**Endpoint**: `POST /api/admin/teams/[id]/members`  
**Email Function**: `sendCollaborationAssignmentEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- User is added to a team via the admin interface
- Email is sent to the newly added user
- Includes collaboration name, project name, who added them, and dashboard link

### 2. Task Assignment Notifications
**Trigger**: When a user is assigned to a task  
**Endpoint**: `POST /api/admin/tasks/assign`  
**Email Function**: `sendTaskAssignmentEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- Task is assigned to one or more users
- Email is sent to each assigned user
- Includes task name, project name, who assigned it, and dashboard link

### 3. Subtask Assignment Notifications
**Trigger**: When a user is assigned to a subtask  
**Endpoint**: `PUT /api/admin/tasks/[id]/subtasks/[subtaskId]`  
**Email Function**: `sendSubtaskAssignmentEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- Subtask is assigned to one or more users
- Email is sent to each assigned user
- Includes subtask name, parent task name, project name, and dashboard link

### 4. Task Status Change Notifications
**Trigger**: When a task status is changed  
**Endpoint**: `PUT /api/admin/tasks/[id]`  
**Email Function**: `sendTaskStatusChangeEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- Task status is updated (pending → in_progress → completed, etc.)
- Email is sent to all task assignees
- Includes old status, new status, who changed it, and dashboard link

### 5. Task Completion Notifications
**Trigger**: When a task is marked as completed  
**Endpoint**: `PUT /api/admin/tasks/[id]`  
**Email Function**: `sendTaskCompletionEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- Task status is changed to "completed"
- Email is sent to all task assignees
- Includes task name, who completed it, completion date, and dashboard link

### 6. Mention Notifications
**Trigger**: When a user is @mentioned in a discussion  
**Endpoint**: `POST /api/collaborations/[id]/discussions`  
**Email Function**: `sendMentionNotificationEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- User is @mentioned in an insight or discussion
- Email is sent to the mentioned user
- Includes who mentioned them, content preview, task name, and direct link

### 7. Due Date Change Notifications
**Trigger**: When a task due date is changed  
**Endpoint**: `PUT /api/admin/tasks`  
**Email Function**: `sendDueDateChangeEmail()`  
**Status**: ✅ **Newly Implemented**

**What happens**:
- Task due date is updated via the admin interface
- Email is sent to all task assignees
- Includes old due date, new due date, who changed it, and dashboard link

### 8. New Insight Notifications
**Trigger**: When a new insight is added to a task  
**Endpoint**: `POST /api/collaborations/[id]/discussions`  
**Email Function**: `sendNewInsightEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- New insight is posted to a task
- Email is sent to all task assignees
- Includes insight author, content preview, task name, and direct link

### 9. Due Soon Reminders
**Trigger**: Scheduled check for tasks due within 2 days  
**Endpoint**: `GET /api/scheduled-notifications`  
**Email Function**: `sendDueSoonReminderEmail()`  
**Status**: ✅ **Newly Implemented**

**What happens**:
- Scheduled job runs daily (configurable)
- Checks for tasks due within 2 days
- Sends reminder emails to task assignees
- Includes days until due, task name, and dashboard link

### 10. Overdue Notifications
**Trigger**: Scheduled check for overdue tasks  
**Endpoint**: `GET /api/scheduled-notifications`  
**Email Function**: `sendOverdueNotificationEmail()`  
**Status**: ✅ **Newly Implemented**

**What happens**:
- Scheduled job runs daily (configurable)
- Checks for tasks past their due date
- Sends urgent notification emails to task assignees
- Includes days overdue, task name, and dashboard link

### 11. Collaboration Removal Notifications
**Trigger**: When a user is removed from a collaboration  
**Endpoint**: `PUT /api/admin/teams/[id]/members`  
**Email Function**: `sendCollaborationRemovalEmail()`  
**Status**: ✅ **Already Implemented**

**What happens**:
- User is removed from a team
- Email is sent to the removed user
- Includes collaboration name, who removed them, and fallback dashboard link

## 🔧 Setup Requirements

### For Real-time Notifications (1-8, 11)
These notifications are triggered automatically when the corresponding actions occur. No additional setup is required.

### For Scheduled Notifications (9-10)
These require a cron job or scheduled task to be set up:

1. **Cron Job Setup**:
   ```bash
   # Run daily at 9 AM
   0 9 * * * cd /path/to/app && node scripts/run-scheduled-notifications.js
   ```

2. **Environment Variables**:
   ```bash
   APP_URL=https://your-domain.com
   RESEND_API_KEY=your_resend_api_key
   ```

3. **Manual Testing**:
   ```bash
   # Test the endpoint
   curl -X GET "http://localhost:4321/api/scheduled-notifications"
   
   # Run the script
   node scripts/run-scheduled-notifications.js
   ```

## 📧 Email Configuration

All notifications use the existing email infrastructure:
- **Service**: Resend
- **Configuration**: `src/utils/emailConfig.ts`
- **Base URL**: Configured via `getEmailBaseUrl()`
- **Templates**: Consistent styling with brand colors

## 🛡️ Security & Error Handling

- **Authentication**: All endpoints require proper user authentication
- **Permission Checks**: Users can only trigger notifications for tasks they have access to
- **Error Handling**: Email failures don't break the main operation
- **Logging**: All notification attempts are logged for debugging
- **Rate Limiting**: Consider adding rate limiting for production use

## 📊 Monitoring

### Check Notification Status
```bash
# View application logs
tail -f /var/log/app.log | grep "📧"

# Test specific endpoints
curl -X GET "https://your-domain.com/api/scheduled-notifications"
```

### Debug Mode
Set environment variable for detailed logging:
```bash
export DEBUG_NOTIFICATIONS=true
```

## 🎯 Notification Types Summary

| Notification Type | Trigger | Status | Email Function |
|------------------|---------|--------|----------------|
| Collaboration Assignment | User added to team | ✅ Implemented | `sendCollaborationAssignmentEmail` |
| Task Assignment | User assigned to task | ✅ Implemented | `sendTaskAssignmentEmail` |
| Subtask Assignment | User assigned to subtask | ✅ Implemented | `sendSubtaskAssignmentEmail` |
| Task Status Change | Task status updated | ✅ Implemented | `sendTaskStatusChangeEmail` |
| Task Completion | Task marked complete | ✅ Implemented | `sendTaskCompletionEmail` |
| Mention Notifications | User @mentioned | ✅ Implemented | `sendMentionNotificationEmail` |
| Due Date Change | Task due date updated | ✅ Implemented | `sendDueDateChangeEmail` |
| New Insight | New insight posted | ✅ Implemented | `sendNewInsightEmail` |
| Due Soon Reminders | Scheduled daily check | ✅ Implemented | `sendDueSoonReminderEmail` |
| Overdue Notifications | Scheduled daily check | ✅ Implemented | `sendOverdueNotificationEmail` |
| Collaboration Removal | User removed from team | ✅ Implemented | `sendCollaborationRemovalEmail` |

## 🚀 Next Steps

1. **Set up cron job** for scheduled notifications (due soon/overdue)
2. **Configure environment variables** for production
3. **Test all notification types** in your environment
4. **Monitor logs** to ensure notifications are being sent
5. **Customize email templates** if needed

All email notification triggers are now fully implemented and ready for use! 🎉
