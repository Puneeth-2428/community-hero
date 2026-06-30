import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../config/database.js';

export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  });
};
