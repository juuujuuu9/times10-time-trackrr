# Scheduled Notifications Setup Guide

This guide explains how to set up automated email notifications for due soon and overdue tasks.

## Overview

The system includes two types of scheduled notifications:
- **Due Soon Reminders**: Sent for tasks due within 2 days
- **Overdue Notifications**: Sent for tasks that are past their due date

## API Endpoint

The notifications are triggered via the `/api/scheduled-notifications` endpoint:
- **GET**: Runs the notification check
- **POST**: Manual trigger for testing

## Setup Options

### Option 1: Cron Job (Recommended for Production)

1. **Create a cron job** to run daily:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to run daily at 9 AM
   0 9 * * * cd /path/to/your/app && node scripts/run-scheduled-notifications.js
   ```

2. **For production servers**, use the full path and set environment variables:
   ```bash
   0 9 * * * cd /var/www/times10-tracker && APP_URL=https://your-domain.com node scripts/run-scheduled-notifications.js
   ```

### Option 2: External Cron Service

Use services like:
- **Vercel Cron Jobs**: Add to `vercel.json`
- **GitHub Actions**: Create a scheduled workflow
- **AWS Lambda**: Set up a scheduled function
- **Heroku Scheduler**: Use the add-on

#### Vercel Cron Jobs Example

Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scheduled-notifications",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### GitHub Actions Example

Create `.github/workflows/scheduled-notifications.yml`:
```yaml
name: Scheduled Notifications
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notifications
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/scheduled-notifications"
```

### Option 3: Manual Testing

Test the notifications manually:
```bash
# Using curl
curl -X GET "http://localhost:4321/api/scheduled-notifications"

# Using the script
node scripts/run-scheduled-notifications.js
```

## Configuration

### Environment Variables

Set these environment variables for production:

```bash
# Required
APP_URL=https://your-domain.com
RESEND_API_KEY=your_resend_api_key

# Optional
EMAIL_FROM=noreply@your-domain.com
EMAIL_REPLY_TO=support@your-domain.com
```

### Notification Settings

The system checks for:
- **Due Soon**: Tasks due within 2 days (including today)
- **Overdue**: Tasks past their due date
- **Status**: Only pending tasks (not completed/cancelled)

## Monitoring

### Check Logs

Monitor the application logs for notification activity:
```bash
# View recent logs
tail -f /var/log/your-app.log | grep "📧"

# Check cron job logs
grep "scheduled-notifications" /var/log/syslog
```

### Test Endpoint

Test the endpoint manually:
```bash
# Check if endpoint is working
curl -X GET "https://your-domain.com/api/scheduled-notifications"

# Manual trigger
curl -X POST "https://your-domain.com/api/scheduled-notifications"
```

## Troubleshooting

### Common Issues

1. **No notifications being sent**:
   - Check `RESEND_API_KEY` is set
   - Verify email configuration
   - Check application logs for errors

2. **Cron job not running**:
   - Verify cron service is running: `systemctl status cron`
   - Check cron logs: `grep CRON /var/log/syslog`
   - Test script manually: `node scripts/run-scheduled-notifications.js`

3. **API endpoint not accessible**:
   - Ensure application is running
   - Check firewall settings
   - Verify `APP_URL` environment variable

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG_NOTIFICATIONS=true
```

This will provide detailed logs about notification processing.

## Security Considerations

1. **API Protection**: The endpoint is public but only processes notifications
2. **Rate Limiting**: Consider adding rate limiting for production
3. **Authentication**: For sensitive environments, add API key authentication

## Performance

- **Batch Processing**: Notifications are sent in batches to avoid overwhelming the email service
- **Error Handling**: Failed notifications don't stop the process
- **Logging**: All notification attempts are logged for debugging

## Customization

### Modify Notification Timing

Edit `src/pages/api/scheduled-notifications.ts`:
```typescript
// Change from 2 days to 3 days
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);
```

### Add Custom Filters

Add additional filters in the query:
```typescript
// Only notify for high priority tasks
eq(tasks.priority, 'high')
```

### Custom Notification Content

Modify the email templates in `src/utils/email.ts`:
- `sendDueSoonReminderEmail()`
- `sendOverdueNotificationEmail()`
