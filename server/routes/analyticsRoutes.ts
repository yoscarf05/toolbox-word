import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, AnalyticsEventRecord, SystemErrorRecord } from '../db';
import { AuthenticatedRequest } from '../middleware';

export const analyticsRouter = express.Router();

// Active visitors heartbeat cache: ipHash -> lastSeenTimestamp
export const activeHeartbeats = new Map<string, { timestamp: number; path: string; isRegistered: boolean }>();

// Clean heartbeats older than 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, val] of activeHeartbeats.entries()) {
    if (val.timestamp < cutoff) {
      activeHeartbeats.delete(key);
    }
  }
}, 60000);

function getIpHash(req: Request): string {
  const rawIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const ip = String(rawIp).split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

// 1. Ingest telemetry event
analyticsRouter.post('/event', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      type,
      toolSlug,
      category,
      durationMs,
      status,
      errorType,
      errorMessage,
      path
    } = req.body;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Tipo de evento requerido.' });
    }

    const ipHash = getIpHash(req);
    const now = Date.now();
    const ua = req.headers['user-agent']?.slice(0, 150) || '';

    // Record heartbeat
    activeHeartbeats.set(ipHash, {
      timestamp: now,
      path: String(path || '/').slice(0, 100),
      isRegistered: !!req.user
    });

    const data = db.getData();

    // Store aggregate event (NO document content is ever stored!)
    const eventRecord: AnalyticsEventRecord = {
      id: `evt_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type: String(type).slice(0, 50),
      toolSlug: toolSlug ? String(toolSlug).slice(0, 50) : undefined,
      category: category ? String(category).slice(0, 50) : undefined,
      durationMs: typeof durationMs === 'number' && durationMs >= 0 ? Math.min(durationMs, 600000) : undefined,
      status: status === 'failed' ? 'failed' : 'success',
      errorType: errorType ? String(errorType).slice(0, 80) : undefined,
      path: path ? String(path).slice(0, 100) : undefined,
      ipHash,
      userAgent: ua,
      timestamp: now
    };

    data.analyticsEvents.push(eventRecord);
    // Keep last 20,000 events for rolling metrics
    if (data.analyticsEvents.length > 20000) {
      data.analyticsEvents.splice(0, data.analyticsEvents.length - 20000);
    }

    // If an error occurred during tool execution, index into systemErrors
    if (status === 'failed' || errorType || errorMessage) {
      const errMsg = String(errorMessage || errorType || 'Error desconocido').slice(0, 300);
      const toolKey = toolSlug ? String(toolSlug) : 'general';

      const existingErr = data.systemErrors.find(
        (e) => e.tool === toolKey && e.errorType === (errorType || 'RuntimeError') && e.status !== 'resolved'
      );

      if (existingErr) {
        existingErr.frequency++;
        existingErr.lastSeenAt = now;
        existingErr.technicalMessage = errMsg;
      } else {
        const newError: SystemErrorRecord = {
          id: `err_${now}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          tool: toolKey,
          errorType: String(errorType || 'ConversionError').slice(0, 80),
          technicalMessage: errMsg,
          endpoint: path ? String(path).slice(0, 100) : undefined,
          browser: ua,
          status: 'new',
          frequency: 1,
          lastSeenAt: now
        };
        data.systemErrors.unshift(newError);
        if (data.systemErrors.length > 500) {
          data.systemErrors.length = 500;
        }
      }

      // Check for error spikes
      const recentErrors = data.systemErrors.filter(e => e.lastSeenAt > now - 15 * 60 * 1000);
      if (recentErrors.length >= 10) {
        data.adminAlerts.unshift({
          id: `alt_${now}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          severity: 'warning',
          type: 'error_spike',
          message: `Alerta: Se han detectado ${recentErrors.length} errores técnicos en los últimos 15 minutos en ${toolKey}.`,
          read: false
        });
      }
    }

    db.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('[ANALYTICS] Ingestion error:', err);
    return res.status(500).json({ error: 'Error procesando evento analítico.' });
  }
});

// 2. Client ping / heartbeat
analyticsRouter.post('/heartbeat', (req: AuthenticatedRequest, res: Response) => {
  const ipHash = getIpHash(req);
  const now = Date.now();
  const path = req.body?.path || '/';

  activeHeartbeats.set(ipHash, {
    timestamp: now,
    path: String(path).slice(0, 100),
    isRegistered: !!req.user
  });

  return res.json({ success: true, timestamp: now });
});
