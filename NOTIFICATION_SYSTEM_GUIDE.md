# Notification System Guide

## Overview

The notification system has been successfully implemented in the DashboardLayout.astro file. It includes:

1. **Notification Bell Icon** - Added to the header between the role badge and menu button
2. **Notification Center Dropdown** - A dropdown that shows when clicking the bell icon
3. **Notification Dot Indicator** - A red dot that appears when there are unread notifications
4. **Event-Driven Notifications** - System listens for custom events to trigger notifications

## Features

### Visual Components
- **Bell Icon**: Custom SVG bell icon in the header
- **Notification Dot**: Red pulsing dot indicator for unread notifications
- **Dropdown**: Clean, modern notification center with scrollable list
- **Mark as Read**: Individual and bulk "mark as read" functionality

### Notification Types
The system listens for these custom events:
- `timeEntryCreated` - When a time entry is created
- `collaborationUpdated` - When a collaboration is updated
- `taskAssigned` - When a task is assigned to a user
- `subtaskCreated` - When a subtask is created
- `insightAdded` - When an insight is added to a collaboration

## Usage

### Triggering Notifications

To trigger a notification from your code, dispatch a custom event:

```javascript
// Time entry notification
const event = new CustomEvent('timeEntryCreated', { 
  detail: { duration: '2h 30m' } 
});
document.dispatchEvent(event);

// Collaboration notification
const event = new CustomEvent('collaborationUpdated', { 
  detail: { name: 'Project Alpha' } 
});
document.dispatchEvent(event);
```

### Using the Utility Functions

Import and use the utility functions from `src/utils/notificationUtils.ts`:

```typescript
import { 
  triggerTimeEntryNotification,
  triggerCollaborationNotification,
  triggerTaskAssignmentNotification,
  triggerSubtaskNotification,
  triggerInsightNotification
} from '../utils/notificationUtils';

// Trigger notifications
triggerTimeEntryNotification({ duration: '1h 45m' });
triggerCollaborationNotification({ name: 'New Project' });
triggerTaskAssignmentNotification({ taskName: 'Code Review' });
triggerSubtaskNotification({ subtaskName: 'Update Tests' });
triggerInsightNotification({});
```

### Testing the System

You can test the notification system by opening the browser console and running:

```javascript
// This will trigger 5 test notifications with delays
window.testNotifications();
```

## Implementation Details

### Notification Center Class

The `NotificationCenter` class handles:
- Storing notifications in localStorage
- Managing read/unread states
- Updating the UI display
- Handling user interactions

### Event Listeners

The system automatically listens for these events:
- Click on bell icon (toggle dropdown)
- Click outside dropdown (close dropdown)
- Click on "Mark all as read" button
- Click on individual notifications (mark as read)

### Data Persistence

Notifications are stored in localStorage with the key `'notifications'`. The data structure includes:
- `id`: Unique identifier
- `type`: Notification type
- `title`: Notification title
- `message`: Notification message
- `timestamp`: When the notification was created
- `read`: Boolean indicating if notification has been read

## Styling

The notification system includes:
- Responsive design that works on mobile and desktop
- Smooth animations and transitions
- Hover effects for better UX
- Pulsing animation for the notification dot
- Clean, modern design matching the app's aesthetic

## Browser Compatibility

The notification system uses:
- Modern JavaScript (ES6+)
- Custom Events API
- localStorage for persistence
- CSS Grid and Flexbox for layout

All features are compatible with modern browsers (Chrome, Firefox, Safari, Edge).

## Future Enhancements

Potential improvements could include:
- Real-time notifications via WebSocket
- Notification categories and filtering
- Sound notifications
- Push notifications for mobile
- Notification history and archiving
- Email integration for important notifications
