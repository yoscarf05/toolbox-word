import { Request, Response, NextFunction } from 'express';
import { db, UserRecord, SessionRecord, AuditLogRecord } from './db';
import { verifySudoTicket } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionRecord?: SessionRecord;
}

// In-memory rate limiting tracker
interface RateLimitBucket {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.blockedUntil && bucket.blockedUntil < now && now - bucket.firstRequest > 300000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export function rateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  blockDurationMs?: number;
  actionName?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.actionName || 'general'}:${String(ip).split(',')[0].trim()}`;
    const now = Date.now();

    let bucket = rateLimitStore.get(key);
    if (!bucket) {
      bucket = { count: 1, firstRequest: now };
      rateLimitStore.set(key, bucket);
      return next();
    }

    // If currently blocked
    if (bucket.blockedUntil && bucket.blockedUntil > now) {
      const waitSeconds = Math.ceil((bucket.blockedUntil - now) / 1000);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Demasiados intentos. Por favor espera ${waitSeconds} segundos antes de reintentar.`,
        retryAfter: waitSeconds
      });
    }

    // Check window
    if (now - bucket.firstRequest > options.windowMs) {
      bucket.count = 1;
      bucket.firstRequest = now;
      bucket.blockedUntil = undefined;
      return next();
    }

    bucket.count++;
    if (bucket.count > options.max) {
      const blockTime = options.blockDurationMs || 15 * 60 * 1000;
      bucket.blockedUntil = now + blockTime;

      // Log security alert in db
      const data = db.getData();
      data.adminAlerts.unshift({
        id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        severity: 'critical',
        type: 'brute_force_prevented',
        message: `Protección de fuerza bruta activada: IP ${ip} bloqueada por exceder intentos en ${options.actionName || 'endpoint'}.`,
        read: false
      });
      db.save();

      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Demasiados intentos. Bloqueo de seguridad temporal activado.',
        retryAfter: Math.ceil(blockTime / 1000)
      });
    }

    next();
  };
}

// Session resolver middleware
export async function resolveSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check cookie or Bearer token
    let token = req.cookies?.toolbox_session;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }

    if (!token) {
      return next();
    }

    const data = db.getData();
    let session = data.sessions.find((s) => s.id === token && s.isValid);
    if (!session) {
      session = (await db.findSession(token)) || undefined;
    }
    if (!session) {
      return next();
    }

    const now = Date.now();
    if (session.expiresAt < now) {
      session.isValid = false;
      await db.saveSession(session);
      return next();
    }

    let user = data.users.find((u) => u.id === session!.userId);
    if (!user) {
      user = (await db.findUserById(session.userId)) || undefined;
    }
    if (!user || user.status === 'blocked') {
      session.isValid = false;
      await db.saveSession(session);
      return next();
    }

    // Touch session
    session.lastActivityAt = now;
    const timeoutMs = (data.settings.sessionTimeoutMinutes || 120) * 60 * 1000;
    session.expiresAt = now + timeoutMs;
    await db.saveSession(session);

    req.user = user;
    req.sessionRecord = session;
    next();
  } catch (err) {
    console.error('[MIDDLEWARE] Error resolving session:', err);
    next();
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.sessionRecord) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Debes iniciar sesión para acceder a este recurso.'
    });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.sessionRecord) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Acceso no autorizado.'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Se requieren privilegios administrativos para realizar esta acción.'
    });
  }

  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.sessionRecord) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Acceso no autorizado.'
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acceso restringido exclusivamente al Super Administrador.'
    });
  }

  next();
}

export function requireSudo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sudoTicket = req.headers['x-sudo-ticket'] as string;
  if (!sudoTicket || !req.user || !verifySudoTicket(sudoTicket, req.user.id)) {
    return res.status(403).json({
      error: 'SudoRequired',
      message: 'Esta acción crítica requiere reautenticación de seguridad (contraseña y TOTP).'
    });
  }
  next();
}

export function logAudit(
  req: AuthenticatedRequest,
  action: string,
  targetResource: string,
  details: Record<string, any>,
  status: 'success' | 'denied' = 'success'
) {
  try {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const auditRecord: AuditLogRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      actorId: req.user?.id || 'anonymous',
      actorEmail: req.user?.email || 'anonymous',
      actorRole: req.user?.role || 'user',
      action,
      targetResource,
      details,
      ip: String(ip).split(',')[0].trim(),
      status
    };

    const data = db.getData();
    data.auditLogs.unshift(auditRecord);
    // Keep last 5000 audit logs
    if (data.auditLogs.length > 5000) {
      data.auditLogs.length = 5000;
    }
    db.save();
  } catch (err) {
    console.error('[AUDIT] Failed to save audit log:', err);
  }
}
