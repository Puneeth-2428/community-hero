import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { SocketService } from './SocketService.js';
import { NotificationType } from '@prisma/client';
import { handleSendEmail, handleSendPush } from '../workers/NotificationWorker.js';
export class NotificationService {
  /**
   * Dispatch a notification to a specific user.
   * Evaluates preferences and channels appropriately.
   */
  public static async notifyUser(
    userId: string,
    type: NotificationType,
    payload: Record<string, any>
  ) {
    // 1. Fetch preferences (default to true for inApp/email, false for push if not found)
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } }
    });

    if (!prefs) {
      prefs = {
        id: 'default',
        userId,
        type,
        inApp: true,
        email: true,
        push: false
      };
    }

    // 2. In-App Notification (always store in DB if requested)
    if (prefs.inApp) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          payload
        }
      });

      // Emit real-time notification
      SocketService.getInstance().emitToUser(userId, 'notification:new', notification);
    }

    // 3. Queue Email Delivery
    if (prefs.email) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      if (user?.email) {
        handleSendEmail({
          to: user.email,
          name: user.name,
          type,
          payload
        }).catch(err => console.error('Background email failed:', err));
      }
    }

    // 4. Queue Web Push Delivery
    if (prefs.push) {
      const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
      if (subscriptions.length > 0) {
        handleSendPush({
          subscriptions,
          type,
          payload
        }).catch(err => console.error('Background push failed:', err));
      }
    }
  }

  /**
   * Helper to format a message based on type and payload.
   */
  public static formatMessage(type: NotificationType, payload: any): string {
    switch (type) {
      case 'ISSUE_STATUS_CHANGED':
        return `Issue "${payload.title}" status changed to ${payload.status}.`;
      case 'ISSUE_ASSIGNED':
        return `You were assigned to issue "${payload.title}".`;
      case 'ISSUE_COMMENTED':
        return `New comment on "${payload.title}".`;
      case 'ISSUE_UPVOTED':
        return `Your issue "${payload.title}" received a new upvote.`;
      case 'BADGE_AWARDED':
        return `Congratulations! You earned the "${payload.badgeName}" badge.`;
      default:
        return 'You have a new notification.';
    }
  }
}
