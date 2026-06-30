import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const orchestratorRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Simple check in the route since we don't have a global middleware setup here yet.
  // In a robust system, we would add a fastify hook for JWT verification and role checking.
  fastify.post('/admins', {
    schema: { 
      body: z.object({ 
        email: z.string().email(), 
        password: z.string().min(6),
        name: z.string().optional()
      }),
      // We pass the orchestrator's id to verify they are an orchestrator
      querystring: z.object({
        orchestratorId: z.string()
      })
    }
  }, async (req, reply) => {
    
    // 1. Verify orchestrator
    const orchestrator = await prisma.user.findUnique({ where: { id: req.query.orchestratorId } });
    if (!orchestrator || orchestrator.role !== 'ORCHESTRATOR') {
      reply.status(403);
      return { success: false, message: 'Forbidden: Only Orchestrators can perform this action' };
    }

    const { email, password, name } = req.body;
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      reply.status(400);
      return { success: false, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Provision the ADMIN account
    user = await prisma.user.create({ 
      data: { 
        email, 
        password: hashedPassword,
        name,
        role: 'ADMIN',
        karma: 0 
      } 
    });
    
    return { success: true, message: 'Admin account provisioned successfully', user: { id: user.id, email: user.email, role: user.role } };
  });
};
