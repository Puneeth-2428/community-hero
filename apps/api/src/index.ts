import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { initializeSocket } from './config/socket.js';
import { setupSecurity } from './config/security.js';

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Security & middleware ──
  await setupSecurity(app);

  // ── API docs ──
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Community Hero API',
        description: 'Backend API for the Community Hero platform',
        version: '0.1.0',
      },
      servers: [{ url: `http://localhost:${env.API_PORT}` }],
    },
  });
  
  app.get('/', async () => {
    return { status: 'Community Hero API is running. Visit /docs for Swagger UI.' };
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // ── Decorators ──
  app.decorate('prisma', prisma);

  // ── Socket.IO ──
  initializeSocket(app);

  // ── Routes ──
  await app.register(async (api) => {
    const r = await import('./routes/index.js');
    await api.register(r.healthRoutes, { prefix: '/health' });
    await api.register(r.issueRoutes, { prefix: '/issues' });
    await api.register(r.votesRoutes, { prefix: '/issues' });
    await api.register(r.commentsRoutes, { prefix: '/issues' });
    await api.register(r.notificationsRoutes, { prefix: '/notifications' });
    
    const dashboard = await import('./routes/dashboard.js');
    await api.register(dashboard.dashboardRoutes, { prefix: '/dashboard' });

    const admin = await import('./routes/admin.js');
    await api.register(admin.adminRoutes, { prefix: '/admin' });

    const profile = await import('./routes/profile.js');
    await api.register(profile.profileRoutes, { prefix: '/profile' });

    const leaderboard = await import('./routes/leaderboard.js');
    await api.register(leaderboard.leaderboardRoutes, { prefix: '/leaderboard' });

    const auth = await import('./routes/auth.js');
    await api.register(auth.authRoutes, { prefix: '/auth' });

    const challenges = await import('./routes/challenges.js');
    await api.register(challenges.challengesRoutes, { prefix: '/challenges' });
    
    const orchestrator = await import('./routes/orchestrator.js');
    await api.register(orchestrator.orchestratorRoutes, { prefix: '/orchestrator' });
  }, { prefix: '/api/v1' });

  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // ── Start ──
  try {
    await app.listen({ host: env.API_HOST, port: env.API_PORT });
    app.log.info(' API running at http://${env.API_HOST}:${env.API_PORT}');
    app.log.info(` Docs at http://${env.API_HOST}:${env.API_PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
