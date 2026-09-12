import express from 'express';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { resolveSession } from './middleware';
import { initializeSuperAdmin } from './auth';
import { authRouter } from './routes/authRoutes';
import { analyticsRouter } from './routes/analyticsRoutes';
import { adminRouter } from './routes/adminRoutes';

export function createApp() {
  const app = express();

  // Standard middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Ensure DB ready on cold starts & flush state on finish
  app.use(async (req, res, next) => {
    try {
      await db.ensureReady();
    } catch (err) {
      console.error('[SERVER] Failed to await db readiness:', err);
    }
    res.on('finish', () => {
      db.flushSync();
    });
    next();
  });

  app.use(resolveSession);

  // Check super admin status
  initializeSuperAdmin();

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Toolbox Word API',
      database: 'PostgreSQL',
      timestamp: Date.now()
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/admin', adminRouter);

  return app;
}
