/**
 * Notification utility functions for triggering notifications
 * These functions dispatch custom events that the notification center listens for
 */

export interface NotificationEventDetail {
  duration?: string;
  name?: string;
  taskName?: string;
  subtaskName?: string;
  [key: string]: any;
}

/**
 * Trigger a time entry created notification
 */
export function triggerTimeEntryNotification(detail: NotificationEventDetail) {
  const event = new CustomEvent('timeEntryCreated', { detail });
  document.dispatchEvent(event);
}

/**
 * Trigger a collaboration updated notification
 */
export function triggerCollaborationNotification(detail: NotificationEventDetail) {
  const event = new CustomEvent('collaborationUpdated', { detail });
  document.dispatchEvent(event);
}

/**
 * Trigger a task assignment notification
 */
export function triggerTaskAssignmentNotification(detail: NotificationEventDetail) {
  const event = new CustomEvent('taskAssigned', { detail });
  document.dispatchEvent(event);
}

/**
 * Trigger a subtask created notification
 */
export function triggerSubtaskNotification(detail: NotificationEventDetail) {
  const event = new CustomEvent('subtaskCreated', { detail });
  document.dispatchEvent(event);
}

/**
 * Trigger an insight added notification
 */
export function triggerInsightNotification(detail: NotificationEventDetail) {
  const event = new CustomEvent('insightAdded', { detail });
  document.dispatchEvent(event);
}

/**
 * Test function to demonstrate notification system
 * This can be called from browser console: window.testNotifications()
 */
export function testNotifications() {
  // Test time entry notification
  setTimeout(() => {
    triggerTimeEntryNotification({ duration: '2h 30m' });
  }, 1000);

  // Test collaboration notification
  setTimeout(() => {
    triggerCollaborationNotification({ name: 'Project Alpha' });
  }, 2000);

  // Test task assignment notification
  setTimeout(() => {
    triggerTaskAssignmentNotification({ taskName: 'Review Design Mockups' });
  }, 3000);

  // Test subtask notification
  setTimeout(() => {
    triggerSubtaskNotification({ subtaskName: 'Update Documentation' });
  }, 4000);

  // Test insight notification
  setTimeout(() => {
    triggerInsightNotification({});
  }, 5000);
}

// Make test function available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testNotifications = testNotifications;
}
