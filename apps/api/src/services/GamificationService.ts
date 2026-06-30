import { prisma } from '../config/database.js';
import { KarmaActionType } from '@prisma/client';
import { BadgeService } from './BadgeService.js';

export class GamificationService {
  /**
   * Awards karma points to a user based on the action type.
   * If the config doesn't exist, it uses a fallback.
   */
  public static async awardKarma(
    userId: string,
    actionType: KarmaActionType,
    referenceId?: string
  ): Promise<void> {
    try {
      // 1. Get points from config
      let config = await prisma.karmaConfig.findUnique({
        where: { actionType }
      });

      // Fallbacks if not seeded
      if (!config) {
        const fallbacks: Record<KarmaActionType, number> = {
          REPORT_ISSUE: 10,
          ISSUE_VERIFIED: 20,
          ISSUE_RESOLVED: 50,
          VERIFY_ISSUE: 5,
          COMMENT_UPVOTED: 5,
          PIONEER_BONUS: 25,
          DUPLICATE_PENALTY: -5
        };
        const points = fallbacks[actionType] || 0;
        config = { actionType, points, updatedAt: new Date() };
      }

      if (config.points === 0) return;

      // 2. Insert History and Update User Karma atomically
      await prisma.$transaction([
        prisma.karmaHistory.create({
          data: {
            userId,
            actionType,
            points: config.points,
            referenceId
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { karma: { increment: config.points } }
        })
      ]);

      // 3. Trigger asynchronous badge evaluation
      BadgeService.evaluateBadges(userId).catch(err => {
        console.error('Failed to evaluate badges:', err);
      });

      // 4. Trigger asynchronous challenge evaluation
      const { ChallengeService } = await import('./ChallengeService.js');
      ChallengeService.evaluateKarmaEvent(userId, actionType).catch(err => {
        console.error('Failed to evaluate challenges:', err);
      });

    } catch (err) {
      console.error(`Error awarding karma for ${userId}:`, err);
    }
  }
}
