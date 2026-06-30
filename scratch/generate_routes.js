const fs = require('fs');
const path = require('path');

const routesDir = 'C:\\Users\\p8162\\.gemini\\antigravity\\scratch\\community-hero\\apps\\api\\src\\routes';

const files = {
  'index.ts': `
export { healthRoutes } from './health.js';
export { issueRoutes } from './issues.js';
export { votesRoutes } from './votes.js';
export { commentsRoutes } from './comments.js';
export { notificationsRoutes } from './notifications.js';
export { dashboardRoutes } from './dashboard.js';
export { adminRoutes } from './admin.js';
export { profileRoutes } from './profile.js';
export { leaderboardRoutes } from './leaderboard.js';
export { challengesRoutes } from './challenges.js';
export { authRoutes } from './auth.js';
  `,
  'health.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../config/database.js';

export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    await prisma.$queryRaw\`SELECT 1\`;
    return { status: 'ok' };
  });
};
  `,
  'auth.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/send-otp', {
    schema: { body: z.object({ phone: z.string() }) }
  }, async (req, reply) => {
    return { success: true };
  });

  fastify.post('/verify-otp', {
    schema: { body: z.object({ phone: z.string(), code: z.string() }) }
  }, async (req, reply) => {
    let user = await prisma.user.findUnique({ where: { phone: req.body.phone } });
    if (!user) user = await prisma.user.create({ data: { phone: req.body.phone, karma: 0 } });
    const token = await reply.jwtSign({ id: user.id, role: user.role });
    return { success: true, token };
  });
};
  `,
  'issues.ts': `
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
        category: z.nativeEnum(IssueCategory),
        severity: z.nativeEnum(IssueSeverity).optional(),
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
  `,
  'dashboard.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const dashboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', {
    schema: { querystring: z.object({ userId: z.string() }) }
  }, async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.query.userId } });
    return { success: true, data: { user } };
  });
};
  `,
  'admin.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const adminRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/dashboard', {
    schema: { querystring: z.object({ userId: z.string(), ward: z.string().optional() }) }
  }, async (req) => {
    const totalOpen = await prisma.issue.count({ where: { status: 'OPEN' } });
    return { success: true, data: { kpis: { totalOpen } } };
  });
};
  `,
  'profile.ts': `
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
  `,
  'leaderboard.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const leaderboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    const users = await prisma.user.findMany({ orderBy: { karma: 'desc' }, take: 25 });
    return { success: true, data: users };
  });
};
  `,
  'challenges.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const challengesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', async () => {
    const challenges = await prisma.challenge.findMany({ where: { isActive: true } });
    return { success: true, data: challenges };
  });
};
  `,
  'comments.ts': `
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';

export const commentsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/', {
    schema: { body: z.object({ issueId: z.string(), userId: z.string(), text: z.string() }) }
  }, async (req) => {
    const comment = await prisma.comment.create({ data: req.body });
    return { success: true, data: comment };
  });
};
  `,
  'votes.ts': `
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
  `,
  'notifications.ts': `
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
};
  `
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(routesDir, filename), content.trim() + '\\n');
}
