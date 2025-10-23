# Local Email Testing Guide

This guide shows you how to test all email notifications locally in your development environment.

## 🚀 Quick Start

### 1. Start the Email Debug Environment

```bash
# Start MailDev (captures emails locally)
./start-email-debug.sh
```

This will:
- Start MailDev on `http://localhost:1080` (web interface)
- Start SMTP server on `localhost:1025`
- Set environment variables for local debugging

### 2. Start Your Application

```bash
# In a new terminal
npm run dev
```

Your app will be available at `http://localhost:4321`

### 3. Test Email Notifications

```bash
# Run the automated test script
node scripts/test-email-notifications.js
```

## 🧪 Testing Methods

### Method 1: Web Interface (Recommended)

1. **Open the email debug page**: `http://localhost:4321/email-debug`
2. **Enter a test email** (e.g., `test@example.com`)
3. **Select email types**:
   - "All" - Tests all notification types
   - Individual types like "collaboration", "task", "subtask", etc.
4. **Click "Send Test Emails"**
5. **View results** at: `http://localhost:1080`

### Method 2: Automated Script

```bash
# Run the comprehensive test script
node scripts/test-email-notifications.js
```

This script will:
- Test scheduled notifications endpoint
- Send a sample debug email
- Show you all available testing options

### Method 3: Manual API Testing

```bash
# Test scheduled notifications
curl -X GET http://localhost:4321/api/scheduled-notifications

# Test debug emails (single type to avoid rate limits)
curl -X POST http://localhost:4321/api/debug-emails \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "testType": "collaboration"}'
```

## 📧 Available Email Types

| Type | Description | Trigger |
|------|-------------|---------|
| `collaboration` | Collaboration assignment | User added to team |
| `task` | Task assignment | User assigned to task |
| `subtask` | Subtask assignment | User assigned to subtask |
| `mention` | Mention notifications | User @mentioned in discussion |
| `due-soon` | Due date reminders | Task due within 2 days |
| `completion` | Task completion | Task marked complete |
| `insight` | New insight notifications | New insight posted |
| `all` | All types | Comprehensive testing |

## 🔍 Viewing Captured Emails

### MailDev Web Interface
- **URL**: `http://localhost:1080`
- **Features**:
  - View all captured emails
  - Inspect HTML and text content
  - View email headers
  - Download attachments
  - Delete emails

### Console Logs
When emails are sent, you'll see detailed logs:
```
📧 LOCAL DEBUG: COLLABORATION EMAIL
==================================================
📧 Email Type: collaboration
📧 Recipient: test@example.com
📧 Subject: You've been added to a collaboration
📧 Data: {...}
📧 View captured emails at: http://localhost:1080
==================================================
```

## 🧪 Testing Real Notifications

### 1. Create Test Data

To test real notification triggers:

1. **Create a project** in your app
2. **Create a team/collaboration**
3. **Add users to the team**
4. **Create tasks with due dates**
5. **Assign users to tasks**
6. **Post insights and mentions**

### 2. Test Each Notification Type

#### Collaboration Assignment
1. Go to team management
2. Add a user to a team
3. Check MailDev for the notification email

#### Task Assignment
1. Go to task management
2. Assign a user to a task
3. Check MailDev for the notification email

#### Due Date Notifications
1. Create a task with a due date (today or tomorrow)
2. Run: `curl -X GET http://localhost:4321/api/scheduled-notifications`
3. Check MailDev for reminder emails

#### Mention Notifications
1. Go to a task discussion
2. Post a comment with @username
3. Check MailDev for the mention email

## 🔧 Troubleshooting

### MailDev Not Starting
```bash
# Check if ports are available
lsof -i :1080
lsof -i :1025

# Kill processes if needed
kill -9 $(lsof -t -i:1080)
kill -9 $(lsof -t -i:1025)
```

### Emails Not Captured
1. Verify MailDev is running on `localhost:1025`
2. Check console logs for email debug information
3. Ensure environment variables are set:
   ```bash
   export RESEND_API_KEY="local-debug-mode"
   export EMAIL_DEBUG_MODE="true"
   ```

### App Not Responding
1. Ensure your app is running on `http://localhost:4321`
2. Check for any JavaScript errors in the console
3. Verify the email-debug page exists

## 📊 Monitoring and Debugging

### Check Email Status
```bash
# View recent logs
tail -f /var/log/app.log | grep "📧"

# Test specific endpoints
curl -X GET http://localhost:4321/api/scheduled-notifications
```

### Debug Mode
Set environment variable for detailed logging:
```bash
export DEBUG_NOTIFICATIONS=true
```

## 🎯 Testing Checklist

- [ ] MailDev is running on `http://localhost:1080`
- [ ] App is running on `http://localhost:4321`
- [ ] Email debug page loads: `http://localhost:4321/email-debug`
- [ ] Can send test emails via web interface
- [ ] Emails appear in MailDev interface
- [ ] Scheduled notifications endpoint works
- [ ] Real notification triggers work (team assignment, task assignment, etc.)

## 🚀 Production Testing

For production testing, you'll need to:

1. **Set up a cron job** for scheduled notifications
2. **Configure environment variables**:
   ```bash
   APP_URL=https://your-domain.com
   RESEND_API_KEY=your_resend_api_key
   ```
3. **Test with real email addresses** (be careful not to spam!)

## 💡 Tips

1. **Start with the web interface** - it's the easiest way to test
2. **Use the automated script** for quick verification
3. **Test one email type at a time** to avoid rate limits
4. **Check MailDev interface** to see the actual email content
5. **Create test data** to trigger real notifications
6. **Use different email addresses** to test multiple recipients

All email notification triggers are now ready for local testing! 🎉
