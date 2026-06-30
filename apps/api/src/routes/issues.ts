import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { IssueCategory, IssueSeverity } from '@prisma/client';

export const issueRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', {
    schema: { querystring: z.object({ ward: z.string().optional() }) }
  }, async (req) => {
    return prisma.issue.findMany({ where: req.query.ward ? { ward: req.query.ward } : undefined });
  });

  fastify.post('/', {
    schema: {
      body: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        severity: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        ward: z.string().optional(),
        reportedById: z.string()
      })
    }
  }, async (req) => {
    const issue = await prisma.issue.create({ data: req.body });
    return { success: true, data: issue };
  });
};
