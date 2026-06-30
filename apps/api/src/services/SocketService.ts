import { Server } from 'socket.io';

export class SocketService {
  private static instance: SocketService;
  private io: Server;

  private constructor(io: Server) {
    this.io = io;
  }

  public static initialize(io: Server): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(io);
    }
    return SocketService.instance;
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      throw new Error('SocketService is not initialized');
    }
    return SocketService.instance;
  }

  // ── Emit Methods ──

  public emitToWard(wardName: string, event: string, payload: any) {
    this.io.to(`ward:${wardName}`).emit(event, payload);
  }

  public emitToIssue(issueId: string, event: string, payload: any) {
    this.io.to(`issue:${issueId}`).emit(event, payload);
  }

  public emitToUser(userId: string, event: string, payload: any) {
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  public broadcast(event: string, payload: any) {
    this.io.emit(event, payload);
  }
}
