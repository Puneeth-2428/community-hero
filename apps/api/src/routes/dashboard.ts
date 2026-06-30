import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const dashboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/citizen', {
    schema: { querystring: z.object({ userId: z.string().optional() }) }
  }, async (req) => {
    
    let user = null;
    let myIssues: any[] = [];
    
    if (req.query.userId) {
      user = await prisma.user.findUnique({ where: { id: req.query.userId } });
      myIssues = await prisma.issue.findMany({
        where: { reportedById: req.query.userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    return {
      success: true,
      data: {
        summary: {
          userName: user?.name || 'Community Hero',
          totalReported: myIssues.length,
          issuesResolved: myIssues.filter(i => i.status === 'RESOLVED').length,
          avgResolutionTimeDays: 2.5,
          karmaPoints: user?.karma || 0
        },
        myIssues: myIssues,
        wardHealthScore: 85,
        categoryBreakdown: [
          { name: 'Pothole', value: 4 },
          { name: 'Streetlight', value: 3 },
          { name: 'Garbage', value: 5 }
        ],
        timeline: [
          { month: 'Jan', reported: 2, resolved: 1 },
          { month: 'Feb', reported: 4, resolved: 3 }
        ],
        leaderboard: {
          userRank: 42,
          top: [
            { id: '1', name: 'Alice', karma: 1200 },
            { id: '2', name: 'Bob', karma: 950 },
            { id: '3', name: 'Charlie', karma: 800 }
          ]
        }
      }
    };
  });

  fastify.get('/', {
    schema: { querystring: z.object({ userId: z.string() }) }
  }, async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.query.userId } });
    return { success: true, data: { user } };
  });
};
