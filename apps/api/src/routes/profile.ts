import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const profileRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/:id', {
    schema: { params: z.object({ id: z.string() }) }
  }, async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { badges: true } });
    return { success: true, data: user };
  });
};
