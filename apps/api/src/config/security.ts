import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import csrfProtection from '@fastify/csrf-protection';
import { env } from './env.js';

export async function setupSecurity(app: FastifyInstance) {
  // 1. Helmet Headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
      }
    }
  });

  // 2. CORS
  await app.register(cors, {
    origin: env.API_CORS_ORIGIN || true,
    credentials: true,
  });

  // 3. Global Rate Limiter
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: function (request, context) {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `I only allow ${context.max} requests per ${context.after} to this API. Try again soon.`,
      };
    }
  });

  // 4. JWT & Cookies
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    }
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {}
  });

  // 5. CSRF Protection
  await app.register(csrfProtection, { cookieOpts: { signed: true } });
}
