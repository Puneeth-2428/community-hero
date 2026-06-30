import { prisma } from '../config/database.js';
import { KarmaActionType, ChallengeTargetType } from '@prisma/client';
import { NotificationService } from './NotificationService.js';

export class ChallengeService {
  /**
   * Evaluates active challenges based on the user's latest action.
   */
  public static async evaluateKarmaEvent(userId: string, actionType: KarmaActionType): Promise<void> {
    const targetMap: Partial<Record<KarmaActionType, ChallengeTargetType>> = {
      REPORT_ISSUE: 'REPORT_N',
      VERIFY_ISSUE: 'VERIFY_N',
      ISSUE_RESOLVED: 'RESOLVE_N',
    };

    const targetAction = targetMap[actionType];
    if (!targetAction) return;

    try {
      const now = new Date();
      
      // 1. Find active challenges matching this action
      const activeChallenges = await prisma.challenge.findMany({
        where: {
          targetAction,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      });

      if (activeChallenges.length === 0) return;

      // 2. Evaluate each challenge using the Strategy pattern approach
      for (const challenge of activeChallenges) {
        // Fetch or create tracking record
        let userChallenge = await prisma.userChallenge.findUnique({
          where: { userId_challengeId: { userId, challengeId: challenge.id } }
        });

        if (!userChallenge) {
          userChallenge = await prisma.userChallenge.create({
            data: { userId, challengeId: challenge.id, progress: 0 }
          });
        }

        if (userChallenge.completed) continue;

        // Increment progress. (Strategy simplified into dynamic generic counter for now)
        const updatedProgress = userChallenge.progress + 1;
        const isCompleted = updatedProgress >= challenge.targetCount;

        await prisma.userChallenge.update({
          where: { userId_challengeId: { userId, challengeId: challenge.id } },
          data: {
            progress: updatedProgress,
            completed: isCompleted,
            completedAt: isCompleted ? now : null
          }
        });

        if (isCompleted) {
          await this.awardChallengeCompletion(userId, challenge);
        }
      }
    } catch (err) {
      console.error('Error evaluating challenges:', err);
    }
  }

  private static async awardChallengeCompletion(userId: string, challenge: any) {
    // 1. Award Karma via GamificationService (Deferred import to avoid circular dependency)
    const { GamificationService } = await import('./GamificationService.js');
    
    // We update User table directly for the reward to avoid infinite loops with GamificationService
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { karma: { increment: challenge.rewardKarma } }
      }),
      prisma.karmaHistory.create({
        data: {
          userId,
          actionType: 'PIONEER_BONUS', // Mapping reward to a generic type for now
          points: challenge.rewardKarma,
          referenceId: challenge.id
        }
      })
    ]);

    // 2. Award optional Badge
    if (challenge.rewardBadgeId) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: challenge.rewardBadgeId } },
        create: { userId, badgeId: challenge.rewardBadgeId },
        update: {}
      });
    }

    // 3. Notify user
    await NotificationService.notifyUser(userId, 'SYSTEM_ANNOUNCEMENT', {
      title: `Challenge Completed: ${challenge.title}!`,
      body: `You earned ${challenge.rewardKarma} karma points.`,
    });
  }
}
