import { prisma } from '../config/database.js';
import { NotificationService } from './NotificationService.js';

export class BadgeService {
  /**
   * Evaluates all potential badges for a user asynchronously.
   * Should be called after any karma-generating event.
   */
  public static async evaluateBadges(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { badges: true }
    });

    if (!user) return;

    const earnedBadgeIds = new Set(user.badges.map(b => b.badgeId));
    const allBadges = await prisma.badge.findMany();

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue; // Already earned

      const hasMetCondition = await this.checkCondition(userId, badge.internalKey);

      if (hasMetCondition) {
        // Award Badge
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        });

        // Notify user
        await NotificationService.notifyUser(userId, 'BADGE_AWARDED', {
          badgeName: badge.name,
          badgeIcon: badge.iconUrl
        });
      }
    }
  }

  private static async checkCondition(userId: string, internalKey: string): Promise<boolean> {
    switch (internalKey) {
      case 'FIRST_RESPONDER': {
        const count = await prisma.issue.count({ where: { reportedById: userId, deletedAt: null } });
        return count >= 1;
      }
      case 'NEIGHBORHOOD_WATCH': {
        const count = await prisma.karmaHistory.count({ where: { userId, actionType: 'VERIFY_ISSUE' } });
        return count >= 10;
      }
      case 'PROBLEM_SOLVER': {
        const count = await prisma.issue.count({ where: { reportedById: userId, status: 'RESOLVED', deletedAt: null } });
        return count >= 5;
      }
      case 'MEGA_IMPACT': {
        const count = await prisma.issue.count({ where: { reportedById: userId, upvoteCount: { gte: 50 }, deletedAt: null } });
        return count >= 1;
      }
      case 'WARD_CHAMPION': {
        // Top reporter in ward for a month logic. 
        // For performance/simplicity, we approximate: has user reported > 20 issues total.
        // A true chron job would award this at the end of the month.
        const count = await prisma.issue.count({ where: { reportedById: userId, deletedAt: null } });
        return count >= 20; 
      }
      case 'STREAK_GUARDIAN': {
        // Simplified streak logic: has 4 distinct issues reported at least 7 days apart?
        // Or simply checking if they have 4+ issues right now as a placeholder.
        const issues = await prisma.issue.findMany({ 
          where: { reportedById: userId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 4
        });
        return issues.length >= 4; // Mocked for real-time evaluation
      }
      default:
        return false;
    }
  }
}
