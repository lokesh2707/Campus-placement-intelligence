import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeSocketIO } from './realtime/socket.js';

const app = createApp();
const server = http.createServer(app);

// Initialize realtime Socket.IO server
initializeSocketIO(server);

server.listen(env.PORT, () => {
  console.log(`🚀 Placement API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`🔗 API Base: http://localhost:${env.PORT}/api/v1`);
  console.log(`🩺 Health:   http://localhost:${env.PORT}/api/v1/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
