import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const commentsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/:issueId/comments', {
    schema: { body: z.object({ issueId: z.string(), userId: z.string(), text: z.string() }) }
  }, async (req) => {
    const comment = await prisma.comment.create({ data: req.body });
    return { success: true, data: comment };
  });
};
