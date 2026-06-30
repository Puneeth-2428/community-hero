import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const votesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/vote', {
    schema: { body: z.object({ issueId: z.string(), userId: z.string(), type: z.enum(['UPVOTE', 'VERIFY', 'DISPUTE']) }) }
  }, async (req) => {
    const vote = await prisma.vote.create({ data: req.body });
    return { success: true, data: vote };
  });
};
