import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes        from './routes/auth.routes';
import qrRoutes          from './routes/qr.routes';
import officerRoutes     from './routes/officers.routes';
import reportRoutes      from './routes/reports.routes';
import transactionRoutes from './routes/transactions.routes';
import dashboardRoutes   from './routes/dashboard.routes';
import zoneRoutes        from './routes/zones.routes';
import notificationRoutes from './routes/notifications.routes';
import adminRoutes       from './routes/admin.routes';

// Config
import { env } from './config/env';
import { pool } from './config/database';
import { wsBroadcast } from './config/websocket';

const app = express();
const httpServer = createServer(app);

// ─── WebSocket Server (real-time dashboard) ───────────────────────────────────
export const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalRateLimiter);
app.use(requestLogger);

// Ensure upload directory exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Static files (uploaded photos)
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: env.APP_VERSION,
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/qr`,            qrRoutes);
app.use(`${API}/officers`,      officerRoutes);
app.use(`${API}/reports`,       reportRoutes);
app.use(`${API}/transactions`,  transactionRoutes);
app.use(`${API}/dashboard`,     dashboardRoutes);
app.use(`${API}/zones`,         zoneRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`,         adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = env.PORT;
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🅿️  LohParkir API — Dishub Kota Medan      ║
║   Running on: http://localhost:${PORT}          ║
║   Mode: ${env.NODE_ENV.padEnd(38)}║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
