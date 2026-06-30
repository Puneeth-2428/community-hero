import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

import { SocketService } from '../services/SocketService.js';

export const adminRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/dashboard', {
    schema: { querystring: z.object({ userId: z.string(), ward: z.string().optional() }) }
  }, async (req) => {
    const totalOpen = await prisma.issue.count({ where: { status: 'OPEN' } });
    const totalResolved = await prisma.issue.count({ where: { status: 'RESOLVED' } });
    
    // Calculate citizen satisfaction mock for now
    const citizenSatisfaction = 92;
    
    return { 
      success: true, 
      data: { 
        kpis: { 
          totalOpen,
          awaitingAction: totalOpen, // For simplicity
          avgResponseTime: 1.5,
          citizenSatisfaction 
        },
        departmentStats: [
          { id: '1', name: 'Public Works', assigned: totalOpen, resolved: totalResolved, avgDays: 1.2, slaBreaches: 0 },
          { id: '2', name: 'Sanitation', assigned: 0, resolved: 0, avgDays: 0, slaBreaches: 0 }
        ]
      } 
    };
  });

  fastify.get('/issues', {
    schema: { querystring: z.object({ status: z.string().optional() }) }
  }, async (req) => {
    const issues = await prisma.issue.findMany({
      where: req.query.status ? { status: req.query.status } : {},
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return { success: true, data: issues };
  });

  fastify.put('/issues/:id/resolve', {
    schema: { params: z.object({ id: z.string() }) }
  }, async (req) => {
    // 1. Update Issue
    const issue = await prisma.issue.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    // 2. Create Notification for the Citizen
    const notification = await prisma.notification.create({
      data: {
        userId: issue.reportedById,
        type: 'STATUS_UPDATE',
        payload: JSON.stringify({
          title: 'Issue Resolved',
          message: `Your issue "${issue.title}" has been marked as resolved!`,
        }),
      }
    });

    // 3. Emit real-time socket event
    SocketService.getInstance().emitToUser(issue.reportedById, 'notification:new', notification);

    return { success: true, data: issue };
  });

  fastify.get('/insights', {
    schema: { querystring: z.object({ userId: z.string() }) }
  }, async () => {
    return {
      success: true,
      data: [
        "Pothole reports up 15% in Downtown ward",
        "Public Works response time improved by 1 day",
        "Streetlight outages are clustering in Northside"
      ]
    };
  });
};
