import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const notificationsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', {
    schema: { querystring: z.object({ userId: z.string() }) }
  }, async (req) => {
    const notifications = await prisma.notification.findMany({ where: { userId: req.query.userId } });
    return { success: true, data: notifications };
  });

  fastify.get('/preferences', {
    schema: { querystring: z.object({ userId: z.string() }) }
  }, async (req) => {
    const preferences = await prisma.notificationPreference.findMany({ where: { userId: req.query.userId } });
    return { success: true, data: preferences };
  });

  fastify.post('/preferences', {
    schema: {
      body: z.object({
        userId: z.string(),
        type: z.string(),
        inApp: z.boolean(),
        email: z.boolean(),
        push: z.boolean()
      })
    }
  }, async (req) => {
    const { userId, type, inApp, email, push } = req.body;
    const pref = await prisma.notificationPreference.upsert({
      where: {
        userId_type: { userId, type }
      },
      update: { inApp, email, push },
      create: { userId, type, inApp, email, push }
    });
    return { success: true, data: pref };
  });

  fastify.post('/push', {
    schema: {
      body: z.object({
        userId: z.string(),
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string()
        })
      })
    }
  }, async (req) => {
    const { userId, endpoint, keys } = req.body;
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });
    return { success: true, data: sub };
  });
};
