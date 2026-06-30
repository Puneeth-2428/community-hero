import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';

export function createRoleGuard(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Verify JWT
      await request.jwtVerify();
      
      const user = request.user as { id: string; role: Role };

      // 2. Assert Role
      if (!allowedRoles.includes(user.role)) {
        return reply.code(403).send({ error: 'Forbidden: Insufficient permissions' });
      }

      // Attach user to request is handled by jwtVerify
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid or missing token' });
    }
  };
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
