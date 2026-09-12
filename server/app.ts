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

  // Metadata Extractor API (Available in both local & production serverless)
  app.get('/api/extract-metadata', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: 'MissingUrl', message: 'Se requiere el parámetro url.' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        }
      });

      clearTimeout(timeout);
      const html = await response.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err: any) {
      return res.status(500).json({
        error: 'FetchError',
        message: err?.message || 'Error al obtener la URL externa.'
      });
    }
  });

  // Explicit 404 for unmatched /api routes - ALWAYS return JSON, never HTML
  app.all('/api/*', (req, res) => {
    return res.status(404).json({
      error: 'NotFound',
      message: `Ruta API no encontrada: ${req.method} ${req.path}`
    });
  });

  // Global Error Handler - Guarantees JSON response on any unhandled server error
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API-FATAL-ERROR]', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

    return res.status(statusCode).json({
      error: err.name || 'InternalServerError',
      message: err.message || 'Ha ocurrido un error interno en el servidor.'
    });
  });

  return app;
}
