import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const leaderboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    const users = await prisma.user.findMany({ orderBy: { karma: 'desc' }, take: 25 });
    return { success: true, data: users };
  });
};
