import { db } from '../db';
import { notifications } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        read: false,
        createdAt: new Date()
      }).returning();

      console.log(`📧 Notification created for user ${data.userId}:`, data.title);
      return notification[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create mention notifications for multiple users
   */
  static async createMentionNotifications(
    mentionedUserIds: number[],
    authorName: string,
    taskName: string,
    discussionId: number
  ) {
    const notifications = [];
    
    for (const userId of mentionedUserIds) {
      try {
        const notification = await this.createNotification({
          userId,
          type: 'mention',
          title: `You were mentioned by ${authorName}`,
          message: `${authorName} mentioned you in an insight for task "${taskName}"`,
          relatedId: discussionId,
          relatedType: 'discussion'
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to create mention notification for user ${userId}:`, error);
      }
    }
    
    return notifications;
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: number, limit: number = 50) {
    try {
      const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [notifications.createdAt],
        limit
      });

      return userNotifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number) {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId));
      
      console.log(`📧 Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number) {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      
      console.log(`📧 All notifications marked as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: number) {
    try {
      const result = await db.select({ count: notifications.id })
        .from(notifications)
        .where(eq(notifications.userId, userId) && eq(notifications.read, false));
      
      return result.length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
}
