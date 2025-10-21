# Local Email Debug Guide

This guide explains how to debug emails locally when Vercel or external email services are unavailable.

## 🚀 Quick Start

### 1. Start the Email Debug Server

```bash
# Option 1: Using the script
./start-email-debug.sh

# Option 2: Using Node.js directly
node local-email-debug.js

# Option 3: Manual MailDev
npx maildev --web 1080 --smtp 1025
```

### 2. Start Your Application

```bash
# In a new terminal
npm run dev
```

### 3. Test Emails

Visit: **http://localhost:4321/email-debug**

## 📧 What This Setup Provides

### MailDev SMTP Server
- **Web Interface**: http://localhost:1080
- **SMTP Server**: localhost:1025
- **Captures**: All emails sent by your application
- **Features**: View HTML/text content, headers, attachments

### Local Email Debug Interface
- **URL**: http://localhost:4321/email-debug
- **Features**: 
  - Test all email types
  - Send to any email address
  - View results in real-time
  - Direct links to MailDev interface

## 🧪 Testing Different Email Types

### Via Web Interface
1. Go to http://localhost:4321/email-debug
2. Enter test email address
3. Select email type (or "All" for comprehensive testing)
4. Click "Send Test Emails"
5. Check results at http://localhost:1080

### Via API
```bash
# Test all email types
curl -X POST http://localhost:4321/api/debug-emails \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "testType": "all"}'

# Test specific email type
curl -X POST http://localhost:4321/api/debug-emails \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "testType": "invitation"}'
```

## 📋 Available Email Types

| Type | Description | Trigger |
|------|-------------|---------|
| `invitation` | User invitation emails | User added to team |
| `collaboration` | Collaboration assignment | Added to collaboration |
| `task` | Task assignment | Assigned to task |
| `subtask` | Subtask assignment | Assigned to subtask |
| `mention` | Mention notifications | @mentioned in discussion |
| `reassignment` | Task reassignment | Task reassigned to different user |
| `due-soon` | Due date reminders | Task due soon |
| `completion` | Task completion | Task marked complete |
| `insight` | New insight notifications | New insight added |

## 🔧 Configuration

### Environment Variables
The system automatically detects local debug mode when:
- `RESEND_API_KEY` is not set or set to `local-debug-mode`
- `EMAIL_DEBUG_MODE=true`
- `SMTP_HOST=localhost` and `SMTP_PORT=1025`

### Manual Configuration
```bash
export RESEND_API_KEY="local-debug-mode"
export EMAIL_DEBUG_MODE="true"
export SMTP_HOST="localhost"
export SMTP_PORT="1025"
```

## 🐛 Troubleshooting

### MailDev Not Starting
```bash
# Check if port 1080 is available
lsof -i :1080

# Check if port 1025 is available
lsof -i :1025

# Kill processes if needed
kill -9 $(lsof -t -i:1080)
kill -9 $(lsof -t -i:1025)
```

### Emails Not Captured
1. Verify MailDev is running on localhost:1025
2. Check console logs for email debug information
3. Ensure `EMAIL_DEBUG_MODE=true` is set
4. Verify your app is using the local SMTP configuration

### Web Interface Not Loading
1. Ensure Astro dev server is running (`npm run dev`)
2. Check that the email-debug page exists at `/src/pages/email-debug.astro`
3. Verify no JavaScript errors in browser console

## 📊 Debug Information

### Console Logs
When in debug mode, you'll see detailed logs:
```
📧 LOCAL DEBUG: INVITATION EMAIL
==================================================
📧 Email Type: invitation
📧 Recipient: test@example.com
📧 Subject: Generated from template
📧 Data: {...}
📧 View captured emails at: http://localhost:1080
==================================================
```

### MailDev Interface
- **URL**: http://localhost:1080
- **Features**:
  - View all captured emails
  - Inspect HTML and text content
  - View email headers
  - Download attachments
  - Delete emails

## 🔄 Integration with Existing Tests

This local debug setup works alongside your existing email testing:

```bash
# Existing test endpoints still work
curl -X POST http://localhost:4321/api/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"testType": "collaboration", "email": "test@example.com"}'

# New debug endpoint with more features
curl -X POST http://localhost:4321/api/debug-emails \
  -H "Content-Type: application/json" \
  -d '{"testType": "all", "email": "test@example.com"}'
```

## 🚀 Production Considerations

This setup is for **development and debugging only**. For production:

1. Use proper email service (Resend, SendGrid, etc.)
2. Configure proper SMTP settings
3. Set up email templates and branding
4. Implement proper error handling
5. Add email delivery monitoring

## 📝 Notes

- All emails are captured locally - no external services required
- Perfect for development when Vercel is down
- Works with all existing email functions
- No changes needed to your email templates
- Maintains all email styling and branding

