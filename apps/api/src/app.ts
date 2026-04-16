import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './lib/logger';
import { isRedisHealthy, closeRedis } from './lib/redis';
import { db } from './lib/firebaseAdmin';
import { publicLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { crowdRouter } from './routes/crowd';
import { navigationRouter } from './routes/navigation';
import { queuesRouter } from './routes/queues';
import { alertsRouter } from './routes/alerts';
import { recommendationsRouter } from './routes/recommendations';
import { adminRouter } from './routes/admin';
import { registerCrowdSocket } from './sockets/crowdSocket';
import { startCrowdSimulator } from './jobs/crowdSimulator';

// ──────────────────────────────────────────────────────────────────────────────
// Express application factory
// ──────────────────────────────────────────────────────────────────────────────

export function createApp(): express.Application {
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            'https://maps.googleapis.com',
            'https://maps.gstatic.com',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Google Maps styled map
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'https://maps.googleapis.com',
            'https://maps.gstatic.com',
            'https://*.ggpht.com',
            'https://www.google-analytics.com',
          ],
          connectSrc: [
            "'self'",
            'https://firestore.googleapis.com',
            'https://identitytoolkit.googleapis.com',
            'https://fcmregistrations.googleapis.com',
            'https://www.google-analytics.com',
            'wss:',
            'ws:',
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
        },
      },
      hsts: env.NODE_ENV === 'production',
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ── Trust proxy (Cloud Run / load balancer) ───────────────────────────────
  app.set('trust proxy', 1);

  // ── Health check — exempt from rate limiting ──────────────────────────────
  app.get('/health', async (_req, res) => {
    const redisOk = await isRedisHealthy();
    let firestoreOk = false;

    try {
      // Lightweight liveness check — reads a single document
      await db().collection('_health').limit(1).get();
      firestoreOk = true;
    } catch {
      firestoreOk = false;
    }

    const status = redisOk && firestoreOk ? 'ok' : 'degraded';
    res.status(status === 'ok' ? 200 : 503).json({
      status,
      uptime: process.uptime(),
      redis: redisOk,
      firestore: firestoreOk,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Global rate limiter ───────────────────────────────────────────────────
  app.use('/api', publicLimiter);

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/crowd', crowdRouter);
  app.use('/api/navigation', navigationRouter);
  app.use('/api/queues', queuesRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/admin', adminRouter);

  // ── OpenAPI docs (development only) ──────────────────────────────────────
  if (env.NODE_ENV === 'development') {
    void import('./lib/openapi').then(({ serveApiDocs }) => {
      serveApiDocs(app);
    }).catch(() => {
      // OpenAPI docs are optional — don't crash if not available
    });
  }

  // ── 404 + Error handlers (must be last) ───────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// ──────────────────────────────────────────────────────────────────────────────
// HTTP + Socket.io server bootstrap
// ──────────────────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = createServer(app);

  // Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Register socket namespaces
  registerCrowdSocket(io);

  // Start crowd simulator
  startCrowdSimulator(io);

  // Start HTTP server
  httpServer.listen(env.PORT, () => {
    logger.info({
      message: `🏟️  VenueFlow API running`,
      port: env.PORT,
      env: env.NODE_ENV,
      pid: process.pid,
    });
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ message: `Received ${signal} — shutting down gracefully` });
    httpServer.close(async () => {
      await closeRedis();
      logger.info({ message: 'Server closed' });
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

// Only run bootstrap when this file is the entry point
if (require.main === module) {
  bootstrap().catch((err: unknown) => {
    logger.error({ message: 'Fatal startup error', error: (err as Error).message });
    process.exit(1);
  });
}
