import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { env } from './env.js';
import { SocketService } from '../services/SocketService.js';

export function initializeSocket(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: {
      origin: env.API_CORS_ORIGIN,
      credentials: true,
    },
  });

  SocketService.initialize(io);

  io.on('connection', (socket) => {
    fastify.log.debug(`Socket connected: ${socket.id}`);

    // Client connects and identifies itself to join relevant static rooms
    socket.on('identify', (data: { userId?: string; ward?: string }) => {
      if (data.userId) {
        socket.join(`user:${data.userId}`);
      }
      if (data.ward) {
        socket.join(`ward:${data.ward}`);
      }
    });

    // Dynamic subscription for issues
    socket.on('joinIssueRoom', (issueId: string) => {
      socket.join(`issue:${issueId}`);
    });

    socket.on('leaveIssueRoom', (issueId: string) => {
      socket.leave(`issue:${issueId}`);
    });

    socket.on('disconnect', () => {
      fastify.log.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
