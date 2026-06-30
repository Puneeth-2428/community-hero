import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const challengesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    const challenges = await prisma.challenge.findMany({ where: { isActive: true } });
    return { success: true, data: challenges };
  });
};
