import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/register', {
    schema: { 
      body: z.object({ 
        email: z.string().email(), 
        password: z.string().min(6),
        name: z.string().optional(),
        role: z.enum(['CITIZEN', 'ADMIN']).optional()
      }) 
    }
  }, async (req, reply) => {
    console.log('[AUTH] /register called with', req.body);
    const { email, password, name, role } = req.body;
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log('[AUTH] /register failed: email already exists');
      reply.status(400);
      return { success: false, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // FORCE role to CITIZEN, overriding any client-provided role
    const forcedRole = 'CITIZEN';

    user = await prisma.user.create({ 
      data: { 
        email, 
        password: hashedPassword,
        name,
        role: forcedRole,
        karma: 0 
      } 
    });
    
    console.log('[AUTH] /register success:', user.email);
    const token = await reply.jwtSign({ id: user.id, role: user.role });
    return { success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  fastify.post('/login', {
    schema: { 
      body: z.object({ 
        email: z.string().email(), 
        password: z.string() 
      }) 
    }
  }, async (req, reply) => {
    console.log('[AUTH] /login called with', req.body.email);
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      console.log('[AUTH] /login failed: invalid user');
      reply.status(401);
      return { success: false, message: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('[AUTH] /login failed: invalid password');
      reply.status(401);
      return { success: false, message: 'Invalid credentials' };
    }

    console.log('[AUTH] /login success:', user.email);
    const token = await reply.jwtSign({ id: user.id, role: user.role });
    return { success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
};
