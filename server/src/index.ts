import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { WebSocketServer } from 'ws';
import commandRoutes from './routes/command.js';
import imageRoutes from './routes/generateImage.js';
import proxyRoutes from './routes/proxyImage.js';
import { createIatConnection } from './services/iflytekService.js';

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/speech' });

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api', commandRoutes);
app.use('/api', imageRoutes);
app.use('/api', proxyRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket speech relay: frontend sends audio data, backend relays to iFlytek
wss.on('connection', (ws) => {
  console.log('[WS] Speech client connected');

  let iatConn: ReturnType<typeof createIatConnection> | null = null;

  ws.on('message', (data) => {
    const buf = data as Buffer;

    // First binary message starts the iFlytek connection
    if (!iatConn) {
      iatConn = createIatConnection(
        (result) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'result', ...result }));
          }
        },
        (error) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', error }));
          }
        },
        () => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'end' }));
          }
        }
      );
    }

    iatConn.sendAudio(buf);
  });

  ws.on('close', () => {
    if (iatConn) iatConn.close();
    console.log('[WS] Speech client disconnected');
  });

  ws.on('error', () => {
    if (iatConn) iatConn.close();
  });
});

server.listen(PORT, () => {
  console.log(`\n  Voice Drawing Server running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Speech WS: ws://localhost:${PORT}/ws/speech\n`);
});
