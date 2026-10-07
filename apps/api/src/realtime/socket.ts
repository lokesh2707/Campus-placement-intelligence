import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';

let ioInstance: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        socket.data.user = payload;
      }
    }
    next();
  });

  ioInstance.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (user) {
      // Join private user room for targeted notifications
      socket.join(`user:${user.userId}`);
      if (user.collegeId) {
        socket.join(`college:${user.collegeId}`);
      }
    }

    socket.on('disconnect', () => {
      // Socket cleanup
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
