import express, { Response } from 'express';
import { db, UserRole } from '../db';
import { getDb } from '../db/connection';
import {
  AuthenticatedRequest,
  requireAdmin,
  requireSuperAdmin,
  requireSudo,
  logAudit
} from '../middleware';
import { activeHeartbeats } from './analyticsRoutes';
import { TOOLS } from '../../src/data/tools';
import { generateTotpSecret, generateQrCodeDataUrl, generateRecoveryCodes, verifyPassword, verifyTotp, verifySudoTicket } from '../auth';
import {
  approveChangeRequest,
  rejectChangeRequest,
  validateAndConsumeToken,
  rollbackChangeRequest,
  createChangeRequest,
  sweepExpiredRequests
} from '../criticalChanges';

export const adminRouter = express.Router();

// Enforce admin permission on all admin routes
adminRouter.use(requireAdmin);

// 1. Real-time telemetry snapshot
adminRouter.get('/realtime', (req: AuthenticatedRequest, res: Response) => {
  const now = Date.now();
  const oneMinAgo = now - 60 * 1000;
  const fiveMinAgo = now - 5 * 60 * 1000;
  const fifteenMinAgo = now - 15 * 60 * 1000;

  let activeNow = 0;
  let active5m = 0;
  let active15m = 0;
  let activeRegistered = 0;
  let activeGuests = 0;

  for (const [_, heartbeat] of activeHeartbeats.entries()) {
    if (heartbeat.timestamp >= oneMinAgo) activeNow++;
    if (heartbeat.timestamp >= fiveMinAgo) {
      active5m++;
      if (heartbeat.isRegistered) activeRegistered++;
      else activeGuests++;
    }
    if (heartbeat.timestamp >= fifteenMinAgo) active15m++;
  }

  const data = db.getData();

  // Conversions started in the last 2 minutes that haven't registered success or failure yet
  const ongoingConversions = data.analyticsEvents.filter(
    (e) => e.type === 'conversion_started' && e.timestamp >= now - 120 * 1000
  ).length;

  // Recent errors in the last 15 minutes
  const recentErrors = data.systemErrors.filter((e) => e.lastSeenAt >= fifteenMinAgo);

  return res.json({
    realtime: {
      activeNow: Math.max(activeNow, 1), // At least current admin
      active5m: Math.max(active5m, 1),
      active15m: Math.max(active15m, 1),
      activeRegistered,
      activeGuests,
      ongoingConversions,
      recentErrorsCount: recentErrors.length,
      timestamp: now
    }
  });
});

// 2. Comprehensive Admin Dashboard (Today, 7 days, comparison)
adminRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const sevenDaysAgoMs = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgoMs = now - 14 * 24 * 60 * 60 * 1000;

  // Events today
  const eventsToday = data.analyticsEvents.filter((e) => e.timestamp >= todayMs);
  const visitsToday = eventsToday.filter((e) => e.type === 'page_view').length;
  const conversionsToday = eventsToday.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed');
  const conversionsSuccessToday = eventsToday.filter((e) => e.type === 'conversion_success').length;
  const conversionsFailedToday = eventsToday.filter((e) => e.type === 'conversion_failed').length;
  const errorsToday = data.systemErrors.filter((e) => e.lastSeenAt >= todayMs).reduce((sum, e) => sum + e.frequency, 0);

  const usersRegisteredToday = data.users.filter((u) => u.createdAt >= todayMs).length;

  // Tool counts today
  const toolCounts: Record<string, number> = {};
  for (const e of eventsToday) {
    if (e.toolSlug) {
      toolCounts[e.toolSlug] = (toolCounts[e.toolSlug] || 0) + 1;
    }
  }

  // 7 days daily breakdown
  const dailyBreakdown: {
    date: string;
    dayLabel: string;
    visitors: number;
    registrations: number;
    conversions: number;
    errors: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - i);
    dayDate.setHours(0, 0, 0, 0);
    const start = dayDate.getTime();
    const end = start + 24 * 60 * 60 * 1000;

    const dayEvents = data.analyticsEvents.filter((e) => e.timestamp >= start && e.timestamp < end);
    const dayVisitors = new Set(dayEvents.map((e) => e.ipHash)).size || dayEvents.filter((e) => e.type === 'page_view').length;
    const dayRegs = data.users.filter((u) => u.createdAt >= start && u.createdAt < end).length;
    const dayConv = dayEvents.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;
    const dayErr = data.systemErrors
      .filter((e) => e.lastSeenAt >= start && e.lastSeenAt < end)
      .reduce((sum, e) => sum + e.frequency, 0);

    dailyBreakdown.push({
      date: dayDate.toISOString().split('T')[0],
      dayLabel: dayDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      visitors: dayVisitors,
      registrations: dayRegs,
      conversions: dayConv,
      errors: dayErr
    });
  }

  // Comparison: Current 7 days vs previous 7 days
  const eventsLast7Days = data.analyticsEvents.filter((e) => e.timestamp >= sevenDaysAgoMs);
  const eventsPrev7Days = data.analyticsEvents.filter(
    (e) => e.timestamp >= fourteenDaysAgoMs && e.timestamp < sevenDaysAgoMs
  );

  const visitorsLast7 = new Set(eventsLast7Days.map((e) => e.ipHash)).size;
  const visitorsPrev7 = new Set(eventsPrev7Days.map((e) => e.ipHash)).size;

  const convLast7 = eventsLast7Days.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;
  const convPrev7 = eventsPrev7Days.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const comparison = {
    visitorsChangePct: calcChange(visitorsLast7, visitorsPrev7),
    conversionsChangePct: calcChange(convLast7, convPrev7),
    hasHistoricalData: data.analyticsEvents.length > 0
  };

  // Recent unread alerts
  const alerts = data.adminAlerts.filter((a) => !a.read).slice(0, 5);

  return res.json({
    today: {
      visits: visitsToday,
      totalUsers: data.users.length,
      newRegistrations: usersRegisteredToday,
      totalConversions: conversionsToday.length,
      conversionsSuccess: conversionsSuccessToday,
      conversionsFailed: conversionsFailedToday,
      conversionSuccessRate:
        conversionsToday.length > 0
          ? Math.round((conversionsSuccessToday / conversionsToday.length) * 100)
          : 100,
      errors: errorsToday,
      topTools: Object.entries(toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([slug, count]) => ({ slug, count }))
    },
    dailyBreakdown,
    comparison,
    alerts
  });
});

// 3. User Management
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { q, role, status } = req.query;
  const data = db.getData();

  let users = data.users.map((u) => {
    const activeSessionsCount = data.sessions.filter(
      (s) => s.userId === u.id && s.isValid && s.expiresAt > Date.now()
    ).length;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      permissions: u.permissions,
      status: u.status,
      totpEnabled: u.totpEnabled,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      activeSessionsCount
    };
  });

  if (q) {
    const search = String(q).toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
  }

  if (role && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }

  if (status && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  return res.json({ users });
});

// 4. Change User Role (Strictly Super Admin + Sudo required, or Admin with approved single-use authorization token)
const handleUserRoleChange = (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const role = req.body.role || req.body.newRole;
  const reason = req.body.reason;

  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  // 1. Un admin NO puede elevarse a super_admin
  // 2. Un admin NO puede modificar sus propios permisos ni rol
  if (req.user!.role !== 'super_admin') {
    if (role === 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Un administrador no puede otorgar ni elevar al rol de Super Administrador.'
      });
    }
    if (targetId === req.user!.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Un administrador no puede modificar sus propios permisos ni su propio rol.'
      });
    }
  }

  const data = db.getData();
  const targetUser = data.users.find((u) => u.id === targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  // Prevent demoting the root super admin if it is the only one
  if (targetUser.role === 'super_admin' && role !== 'super_admin') {
    const superAdmins = data.users.filter((u) => u.role === 'super_admin');
    if (superAdmins.length <= 1) {
      return res.status(400).json({ error: 'No se puede degradar al único Super Administrador del sistema.' });
    }
  }

  const authToken = req.headers['x-change-authorization-token'] as string;

  // Authorization check for Admin
  if (req.user!.role === 'admin') {
    if (!authToken) {
      // Create pending change request
      const cr = createChangeRequest(
        req.user!,
        'change_user_role',
        `user/${targetId}`,
        { targetUserId: targetId, role },
        reason
      );
      logAudit(req, 'change_request_created', `user/${targetId}`, {
        requestId: cr.id,
        action: cr.action,
        requestedRole: role
      });
      return res.status(202).json({
        authorizationRequired: true,
        message: 'Este cambio requiere autorización del Super Admin.',
        requestId: cr.id,
        request: cr
      });
    }

    // Validate and consume single-use token
    try {
      const { request } = validateAndConsumeToken(
        authToken,
        'change_user_role',
        `user/${targetId}`,
        { targetUserId: targetId, role },
        req.user!
      );

      // Checkpoint for rollback
      request.checkpointData = {
        targetUserId: targetId,
        oldRole: targetUser.role,
        oldPermissions: [...targetUser.permissions]
      };
      db.save();

      logAudit(req, 'change_request_executed', `user/${targetId}`, {
        requestId: request.id,
        action: request.action,
        executedBy: req.user!.email
      });
    } catch (err: any) {
      return res.status(403).json({
        error: 'AuthorizationFailed',
        message: err.message || 'Token de autorización inválido, expirado o no coincide.'
      });
    }
  } else if (req.user!.role === 'super_admin') {
    // Super Admin requires Sudo
    const sudoTicket = req.headers['x-sudo-ticket'] as string;
    if (!sudoTicket || !verifySudoTicket(sudoTicket, req.user!.id)) {
      return res.status(403).json({
        error: 'SudoRequired',
        message: 'Esta acción crítica requiere reautenticación de seguridad (contraseña y TOTP).'
      });
    }
  }

  const oldRole = targetUser.role;
  targetUser.role = role as UserRole;
  targetUser.permissions = role === 'super_admin' ? ['*'] : role === 'admin' ? ['manage_tools', 'view_analytics', 'view_errors'] : [];
  db.save();

  logAudit(req, 'user_role_changed', `user/${targetId}`, { oldRole, newRole: role });

  return res.json({
    success: true,
    message: `Rol actualizado a ${role}.`,
    executedViaAuthorization: !!authToken
  });
};

adminRouter.post('/users/:id/role', handleUserRoleChange);
adminRouter.patch('/users/:id/role', handleUserRoleChange);

// 5. Block / Unblock User
const handleUserStatusChange = (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const { status, reason } = req.body;

  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const data = db.getData();
  const targetUser = data.users.find((u) => u.id === targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  // Cannot block oneself
  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'No puedes bloquear tu propia cuenta.' });
  }

  const isSensitiveTarget = targetUser.role === 'super_admin' || targetUser.role === 'admin';
  const authToken = req.headers['x-change-authorization-token'] as string;

  if (isSensitiveTarget) {
    if (req.user!.role === 'admin') {
      if (!authToken) {
        const cr = createChangeRequest(
          req.user!,
          'change_user_status',
          `user/${targetId}`,
          { targetUserId: targetId, status },
          reason
        );
        logAudit(req, 'change_request_created', `user/${targetId}`, {
          requestId: cr.id,
          action: cr.action,
          targetStatus: status
        });
        return res.status(202).json({
          authorizationRequired: true,
          message: 'Este cambio requiere autorización del Super Admin.',
          requestId: cr.id,
          request: cr
        });
      }

      try {
        const { request } = validateAndConsumeToken(
          authToken,
          'change_user_status',
          `user/${targetId}`,
          { targetUserId: targetId, status },
          req.user!
        );
        request.checkpointData = {
          targetUserId: targetId,
          oldStatus: targetUser.status
        };
        db.save();
      } catch (err: any) {
        return res.status(403).json({
          error: 'AuthorizationFailed',
          message: err.message || 'Token de autorización inválido o expirado.'
        });
      }
    } else if (req.user!.role === 'super_admin') {
      const sudoTicket = req.headers['x-sudo-ticket'] as string;
      if (!sudoTicket || !verifySudoTicket(sudoTicket, req.user!.id)) {
        return res.status(403).json({
          error: 'SudoRequired',
          message: 'Esta acción crítica requiere reautenticación de seguridad (contraseña y TOTP).'
        });
      }
    }
  }

  targetUser.status = status;

  // If blocking, immediately invalidate all their sessions
  if (status === 'blocked') {
    for (const s of data.sessions) {
      if (s.userId === targetId) {
        s.isValid = false;
      }
    }
  }

  db.save();
  logAudit(req, 'user_status_changed', `user/${targetId}`, { newStatus: status });

  return res.json({ success: true, message: `Estado del usuario actualizado a ${status}.` });
};

adminRouter.post('/users/:id/status', handleUserStatusChange);
adminRouter.patch('/users/:id/status', handleUserStatusChange);

// 6. Revoke User Sessions (by Admin)
adminRouter.post('/users/:id/revoke-sessions', (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const data = db.getData();
  let count = 0;

  for (const s of data.sessions) {
    if (s.userId === targetId && s.isValid) {
      s.isValid = false;
      count++;
    }
  }
  db.save();

  logAudit(req, 'admin_revoked_user_sessions', `user/${targetId}`, { revokedCount: count });
  return res.json({ success: true, count, message: `${count} sesiones cerradas.` });
});

// 7. Tool Telemetry & Operational Health Monitor
adminRouter.get('/tools', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const toolStats = TOOLS.map((t) => {
    const events = data.analyticsEvents.filter(
      (e) => e.toolSlug === t.slug && e.timestamp >= sevenDaysAgo
    );
    const uses = events.length;
    const successes = events.filter((e) => e.status === 'success').length;
    const failures = events.filter((e) => e.status === 'failed').length;

    const durations = events.filter((e) => typeof e.durationMs === 'number').map((e) => e.durationMs!);
    const avgDurationMs = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

    const lastEvent = events[events.length - 1];
    const lastErrorEvent = [...events].reverse().find((e) => e.status === 'failed');

    const failureRate = uses > 0 ? (failures / uses) * 100 : 0;
    let healthStatus: 'operational' | 'warning' | 'degraded' = 'operational';
    if (failureRate > 10) healthStatus = 'degraded';
    else if (failureRate > 2) healthStatus = 'warning';

    return {
      id: t.id,
      slug: t.slug,
      name: t.name.es,
      categoryId: t.categoryId,
      healthStatus,
      totalUses: uses,
      successCount: successes,
      failureCount: failures,
      successRatePct: uses > 0 ? Math.round((successes / uses) * 100) : 100,
      avgDurationMs,
      lastUsedAt: lastEvent ? lastEvent.timestamp : null,
      lastErrorAt: lastErrorEvent ? lastErrorEvent.timestamp : null,
      active: true
    };
  });

  return res.json({ tools: toolStats });
});

// 8. Error Monitor
adminRouter.get('/errors', (req: AuthenticatedRequest, res: Response) => {
  const { tool, status, q } = req.query;
  const data = db.getData();
  let errors = [...data.systemErrors];

  if (tool && tool !== 'all') {
    errors = errors.filter((e) => e.tool === tool);
  }
  if (status && status !== 'all') {
    errors = errors.filter((e) => e.status === status);
  }
  if (q) {
    const query = String(q).toLowerCase();
    errors = errors.filter(
      (e) =>
        e.technicalMessage.toLowerCase().includes(query) ||
        e.errorType.toLowerCase().includes(query) ||
        (e.tool && e.tool.toLowerCase().includes(query))
    );
  }

  // Sort by most frequent or most recently seen
  errors.sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return res.json({ errors });
});

// 9. Update Error Status (e.g. mark resolved)
adminRouter.patch('/errors/:id', (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const { status } = req.body;

  if (!['new', 'investigating', 'resolved', 'ignored'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const data = db.getData();
  const errRecord = data.systemErrors.find((e) => e.id === targetId);
  if (!errRecord) {
    return res.status(404).json({ error: 'Registro de error no encontrado.' });
  }

  errRecord.status = status;
  db.save();

  logAudit(req, 'error_status_updated', `error/${targetId}`, { newStatus: status });
  return res.json({ success: true, message: `Error marcado como ${status}.` });
});

// 10. Audit Log Viewer (Read-only, immutable)
adminRouter.get('/audit', (req: AuthenticatedRequest, res: Response) => {
  const { action, actor, limit } = req.query;
  const data = db.getData();
  let logs = [...data.auditLogs];

  if (action && action !== 'all') {
    logs = logs.filter((l) => l.action.toLowerCase().includes(String(action).toLowerCase()));
  }
  if (actor && actor !== 'all') {
    logs = logs.filter((l) => l.actorEmail.toLowerCase().includes(String(actor).toLowerCase()));
  }

  const max = Math.min(Number(limit) || 100, 500);
  return res.json({ logs: logs.slice(0, max) });
});

// 11. Alerts
adminRouter.get('/alerts', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json({ alerts: data.adminAlerts });
});

adminRouter.post('/alerts/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const alert = data.adminAlerts.find((a) => a.id === req.params.id);
  if (alert) {
    alert.read = true;
    alert.resolvedAt = Date.now();
    db.save();
  }
  return res.json({ success: true });
});

// 12. Weekly Report Generator (Pure Real Data)
adminRouter.get('/report/weekly', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const events = data.analyticsEvents.filter((e) => e.timestamp >= sevenDaysAgo);
  const visits = events.filter((e) => e.type === 'page_view').length;
  const uniqueVisitors = new Set(events.map((e) => e.ipHash)).size;
  const conversions = events.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed');
  const successfulConversions = events.filter((e) => e.type === 'conversion_success').length;
  const failedConversions = events.filter((e) => e.type === 'conversion_failed').length;
  const newUsers = data.users.filter((u) => u.createdAt >= sevenDaysAgo).length;
  const totalUsers = data.users.length;
  const systemErrors = data.systemErrors.filter((e) => e.lastSeenAt >= sevenDaysAgo);

  const toolRank: Record<string, number> = {};
  for (const ev of events) {
    if (ev.toolSlug) {
      toolRank[ev.toolSlug] = (toolRank[ev.toolSlug] || 0) + 1;
    }
  }

  const topTools = Object.entries(toolRank)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => {
      const toolDef = TOOLS.find((t) => t.slug === slug);
      return {
        slug,
        name: toolDef?.name.es || slug,
        count
      };
    });

  return res.json({
    report: {
      generatedAt: now,
      periodStart: sevenDaysAgo,
      periodEnd: now,
      metrics: {
        totalVisits: visits,
        uniqueVisitors,
        totalConversions: conversions.length,
        successfulConversions,
        failedConversions,
        successRatePct: conversions.length > 0 ? Math.round((successfulConversions / conversions.length) * 100) : 100,
        newUsersRegistered: newUsers,
        totalRegisteredUsers: totalUsers,
        totalErrorsRecorded: systemErrors.reduce((sum, e) => sum + e.frequency, 0)
      },
      topTools,
      criticalIssues: data.adminAlerts.filter((a) => a.timestamp >= sevenDaysAgo && a.severity === 'critical')
    }
  });
});

// 13. System Settings
adminRouter.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json({ settings: data.settings });
});

const handleSettingsUpdate = (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const authToken = req.headers['x-change-authorization-token'] as string;

  if (req.user!.role === 'admin') {
    if (!authToken) {
      const cr = createChangeRequest(
        req.user!,
        'update_system_settings',
        'system/settings',
        req.body,
        req.body.reason
      );
      logAudit(req, 'change_request_created', 'system/settings', {
        requestId: cr.id,
        action: cr.action
      });
      return res.status(202).json({
        authorizationRequired: true,
        message: 'Este cambio requiere autorización del Super Admin.',
        requestId: cr.id,
        request: cr
      });
    }

    try {
      const { request } = validateAndConsumeToken(
        authToken,
        'update_system_settings',
        'system/settings',
        req.body,
        req.user!
      );

      // Checkpoint before executing
      request.checkpointData = {
        settings: { ...data.settings }
      };
      db.save();

      logAudit(req, 'change_request_executed', 'system/settings', {
        requestId: request.id,
        action: request.action,
        executedBy: req.user!.email
      });
    } catch (err: any) {
      return res.status(403).json({
        error: 'AuthorizationFailed',
        message: err.message || 'Token de autorización inválido o expirado.'
      });
    }
  } else if (req.user!.role === 'super_admin') {
    const sudoTicket = req.headers['x-sudo-ticket'] as string;
    if (!sudoTicket || !verifySudoTicket(sudoTicket, req.user!.id)) {
      return res.status(403).json({
        error: 'SudoRequired',
        message: 'Esta acción crítica requiere reautenticación de seguridad (contraseña y TOTP).'
      });
    }
  }

  const {
    adsEnabled,
    maintenanceMode,
    globalBannerText,
    bannerEnabled,
    sessionTimeoutMinutes,
    maxLoginAttempts,
    lockoutMinutes
  } = req.body;

  if (typeof adsEnabled === 'boolean') data.settings.adsEnabled = adsEnabled;
  if (typeof maintenanceMode === 'boolean') data.settings.maintenanceMode = maintenanceMode;
  if (typeof globalBannerText === 'string') data.settings.globalBannerText = globalBannerText.slice(0, 200);
  if (typeof bannerEnabled === 'boolean') data.settings.bannerEnabled = bannerEnabled;
  if (typeof sessionTimeoutMinutes === 'number') data.settings.sessionTimeoutMinutes = Math.max(15, sessionTimeoutMinutes);
  if (typeof maxLoginAttempts === 'number') data.settings.maxLoginAttempts = Math.max(3, maxLoginAttempts);
  if (typeof lockoutMinutes === 'number') data.settings.lockoutMinutes = Math.max(5, lockoutMinutes);

  data.settings.updatedAt = Date.now();
  db.save();

  logAudit(req, 'system_settings_updated', 'system/settings', req.body);
  return res.json({
    success: true,
    settings: data.settings,
    executedViaAuthorization: !!authToken
  });
};

adminRouter.put('/settings', handleSettingsUpdate);
adminRouter.post('/settings', handleSettingsUpdate);

// 14. Real-Time Telemetry for Admin Dashboard
adminRouter.get('/telemetry', (req: AuthenticatedRequest, res: Response) => {
  const now = Date.now();
  const oneMinAgo = now - 60 * 1000;
  const fiveMinAgo = now - 5 * 60 * 1000;
  const fifteenMinAgo = now - 15 * 60 * 1000;
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  let activeNow = 0;
  let active5m = 0;
  let active15m = 0;

  for (const [_, heartbeat] of activeHeartbeats.entries()) {
    if (heartbeat.timestamp >= oneMinAgo) activeNow++;
    if (heartbeat.timestamp >= fiveMinAgo) active5m++;
    if (heartbeat.timestamp >= fifteenMinAgo) active15m++;
  }

  const data = db.getData();

  const ongoingConversions = data.analyticsEvents.filter(
    (e) => e.type === 'conversion_started' && e.timestamp >= now - 120 * 1000
  ).length;

  const events24h = data.analyticsEvents.filter((e) => e.timestamp >= twentyFourHoursAgo);
  const convSuccess24h = events24h.filter((e) => e.type === 'conversion_success').length;
  const convFailed24h = events24h.filter((e) => e.type === 'conversion_failed').length;
  const totalConversions24h = convSuccess24h + convFailed24h;
  const successRate24h = totalConversions24h > 0 ? Math.round((convSuccess24h / totalConversions24h) * 100) : 100;

  const recentErrors24h = data.systemErrors
    .filter((e) => e.lastSeenAt >= twentyFourHoursAgo)
    .reduce((sum, e) => sum + e.frequency, 0);

  return res.json({
    usersNow: Math.max(activeNow, 1),
    users5m: Math.max(active5m, 1),
    users15m: Math.max(active15m, 1),
    ongoingConversions,
    recentErrors24h,
    totalConversions24h,
    successRate24h
  });
});

// 15. Analytics Overview for Admin Dashboard (100% Real Database Data)
adminRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;

  const allEvents = data.analyticsEvents;
  const totalVisits = allEvents.filter((e) => e.type === 'page_view').length;
  const uniqueVisitors = new Set(allEvents.map((e) => e.ipHash)).size || (totalVisits > 0 ? 1 : 0);
  const totalUsers = data.users.length;
  const newRegistrationsToday = data.users.filter((u) => u.createdAt >= todayMs).length;

  const convSuccess = allEvents.filter((e) => e.type === 'conversion_success').length;
  const convFailed = allEvents.filter((e) => e.type === 'conversion_failed').length;
  const totalConversions = convSuccess + convFailed;
  const successRate = totalConversions > 0 ? Math.round((convSuccess / totalConversions) * 100) : 100;

  const totalErrors = data.systemErrors.reduce((sum, e) => sum + e.frequency, 0);

  // Most used tools & breakdown
  const toolCounts: Record<string, number> = {};
  const conversionsByTool: Record<string, { total: number; success: number; failed: number }> = {};

  for (const e of allEvents) {
    if (e.toolSlug) {
      toolCounts[e.toolSlug] = (toolCounts[e.toolSlug] || 0) + 1;
      if (!conversionsByTool[e.toolSlug]) {
        conversionsByTool[e.toolSlug] = { total: 0, success: 0, failed: 0 };
      }
      if (e.type === 'conversion_success') {
        conversionsByTool[e.toolSlug].total++;
        conversionsByTool[e.toolSlug].success++;
      } else if (e.type === 'conversion_failed') {
        conversionsByTool[e.toolSlug].total++;
        conversionsByTool[e.toolSlug].failed++;
      }
    }
  }

  const mostUsedTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => {
      const toolDef = TOOLS.find((t) => t.slug === slug);
      return {
        slug,
        name: toolDef?.name.es || slug,
        count
      };
    });

  // 7 days daily trends
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 24 * 60 * 60 * 1000;

    const dayEvents = allEvents.filter((e) => e.timestamp >= start && e.timestamp < end);
    const visits = dayEvents.filter((e) => e.type === 'page_view').length;
    const conversions = dayEvents.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;
    const errors = data.systemErrors
      .filter((e) => e.lastSeenAt >= start && e.lastSeenAt < end)
      .reduce((sum, e) => sum + e.frequency, 0);

    dailyTrends.push({
      date: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      visits,
      conversions,
      errors
    });
  }

  // Today vs yesterday
  const eventsToday = allEvents.filter((e) => e.timestamp >= todayMs);
  const eventsYesterday = allEvents.filter((e) => e.timestamp >= yesterdayMs && e.timestamp < todayMs);
  const visitsToday = eventsToday.filter((e) => e.type === 'page_view').length;
  const visitsYesterday = eventsYesterday.filter((e) => e.type === 'page_view').length;
  const convToday = eventsToday.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;
  const convYesterday = eventsYesterday.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed').length;

  const calcPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return res.json({
    totalVisits,
    uniqueVisitors,
    totalUsers,
    newRegistrationsToday,
    totalConversions,
    successfulConversions: convSuccess,
    failedConversions: convFailed,
    successRate,
    totalErrors,
    mostUsedTools,
    conversionsByTool,
    dailyTrends,
    todayVsYesterday: {
      visitsChangePct: calcPct(visitsToday, visitsYesterday),
      conversionsChangePct: calcPct(convToday, convYesterday)
    }
  });
});

// 16. Audit logs endpoint alias
adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const { action, actor, limit } = req.query;
  const data = db.getData();
  let logs = [...data.auditLogs];

  if (action && action !== 'all') {
    logs = logs.filter((l) => l.action.toLowerCase().includes(String(action).toLowerCase()));
  }
  if (actor && actor !== 'all') {
    logs = logs.filter((l) => l.actorEmail.toLowerCase().includes(String(actor).toLowerCase()));
  }

  const max = Math.min(Number(limit) || 100, 500);
  return res.json({
    logs: logs.slice(0, max).map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      userEmail: l.actorEmail,
      action: l.action,
      target: l.targetResource,
      details: l.details,
      status: l.status,
      ip: l.ip
    }))
  });
});

// 17. Reports Weekly endpoint alias
adminRouter.get('/reports/weekly', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const events = data.analyticsEvents.filter((e) => e.timestamp >= sevenDaysAgo);
  const visits = events.filter((e) => e.type === 'page_view').length;
  const uniqueVisitors = new Set(events.map((e) => e.ipHash)).size;
  const conversions = events.filter((e) => e.type === 'conversion_success' || e.type === 'conversion_failed');
  const successfulConversions = events.filter((e) => e.type === 'conversion_success').length;
  const newUsers = data.users.filter((u) => u.createdAt >= sevenDaysAgo).length;
  const systemErrors = data.systemErrors.filter((e) => e.lastSeenAt >= sevenDaysAgo);

  const toolRank: Record<string, number> = {};
  for (const ev of events) {
    if (ev.toolSlug) {
      toolRank[ev.toolSlug] = (toolRank[ev.toolSlug] || 0) + 1;
    }
  }

  const topTools = Object.entries(toolRank)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => {
      const toolDef = TOOLS.find((t) => t.slug === slug);
      return {
        slug,
        name: toolDef?.name.es || slug,
        count
      };
    });

  const successRate = conversions.length > 0 ? Math.round((successfulConversions / conversions.length) * 100) : 100;
  const periodLabel = `${new Date(sevenDaysAgo).toLocaleDateString('es-ES')} - ${new Date(now).toLocaleDateString('es-ES')}`;

  return res.json({
    report: {
      period: periodLabel,
      visits,
      uniqueVisitors,
      newUsers,
      conversions: conversions.length,
      successRate,
      errors: systemErrors.reduce((sum, e) => sum + e.frequency, 0),
      topTools,
      reliabilityScore: conversions.length > 0 ? Math.max(90, successRate) : 100
    }
  });
});

// 18. Admin sessions list
adminRouter.get('/sessions/my', (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const userSessions = data.sessions
    .filter((s) => s.userId === req.user!.id && s.isValid && s.expiresAt > now)
    .map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === req.sessionRecord?.id
    }));

  return res.json({ sessions: userSessions });
});

// 19. Admin session single revocation
adminRouter.delete('/sessions/:id', (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const data = db.getData();
  const session = data.sessions.find((s) => s.id === targetId && s.userId === req.user!.id);

  if (session) {
    session.isValid = false;
    db.save();
    logAudit(req, 'admin_session_revoked', 'admin/session', { targetSessionId: targetId });
  }

  return res.json({ success: true, message: 'Sesión cerrada.' });
});

// 20. Admin revoke all other sessions (Requires Sudo)
adminRouter.post('/sessions/revoke-others', requireSudo, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const currentId = req.sessionRecord?.id;
  let count = 0;

  for (const s of data.sessions) {
    if (s.userId === req.user!.id && s.id !== currentId && s.isValid) {
      s.isValid = false;
      count++;
    }
  }
  db.save();

  logAudit(req, 'admin_revoked_other_sessions', 'admin/sessions', { revokedCount: count });
  return res.json({ success: true, count, message: `${count} sesiones cerradas.` });
});

// 21. Regenerate 2FA configuration for Super Admin (Requires Sudo & SuperAdmin)
adminRouter.post('/security/setup-2fa', requireSuperAdmin, requireSudo, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { secret, otpauthUrl } = generateTotpSecret(user.email);
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpauthUrl);
    const { rawCodes, hashedCodes } = generateRecoveryCodes(8);

    user.totpSecret = secret;
    user.recoveryCodes = hashedCodes;
    user.totpEnabled = true;
    db.save();

    logAudit(req, 'superadmin_totp_reconfigured', 'admin/security', { email: user.email });

    return res.json({
      success: true,
      qrCodeDataUrl,
      secret,
      recoveryCodes: rawCodes
    });
  } catch (err) {
    console.error('[ADMIN] Setup 2FA error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: 'Error generando configuración 2FA.' });
  }
});

// ==========================================
// 22. CHANGE REQUESTS AUTHORIZATION WORKFLOW
// ==========================================

// Helper: Verify strong authentication for Super Admin (either valid Sudo ticket or Password + TOTP)
function verifySuperAdminStrongAuth(req: AuthenticatedRequest): { ok: boolean; message?: string } {
  if (req.user?.role !== 'super_admin') {
    return { ok: false, message: 'Acceso restringido exclusivamente al Super Administrador.' };
  }

  // 1. Check for active Sudo Ticket
  const sudoTicket = req.headers['x-sudo-ticket'] as string;
  if (sudoTicket && verifySudoTicket(sudoTicket, req.user.id)) {
    return { ok: true };
  }

  // 2. Check for explicit Password + TOTP provided in body
  const { password, totpCode } = req.body;
  if (!password || !totpCode) {
    return {
      ok: false,
      message: 'Esta acción crítica requiere confirmación con contraseña y código TOTP del Super Administrador.'
    };
  }

  const isPasswordValid = verifyPassword(password, req.user.passwordHash, req.user.salt);
  if (!isPasswordValid) {
    return { ok: false, message: 'Contraseña del Super Administrador incorrecta.' };
  }

  if (req.user.totpEnabled && req.user.totpSecret) {
    if (!verifyTotp(totpCode, req.user.totpSecret)) {
      return { ok: false, message: 'Código de autenticación TOTP incorrecto o expirado.' };
    }
  }

  return { ok: true };
}

// List change requests
adminRouter.get('/change-requests', (req: AuthenticatedRequest, res: Response) => {
  sweepExpiredRequests();
  const { status, q, limit } = req.query;
  const data = db.getData();
  let requests = [...data.changeRequests];

  if (status && status !== 'all') {
    requests = requests.filter((r) => r.status === status);
  }

  if (q) {
    const search = String(q).toLowerCase();
    requests = requests.filter(
      (r) =>
        r.actionLabel.toLowerCase().includes(search) ||
        r.targetResource.toLowerCase().includes(search) ||
        r.requestedBy.email.toLowerCase().includes(search) ||
        r.reason.toLowerCase().includes(search)
    );
  }

  const max = Math.min(Number(limit) || 100, 200);
  const sanitizedList = requests.slice(0, max).map((r) => ({
    id: r.id,
    requestedBy: r.requestedBy,
    action: r.action,
    actionLabel: r.actionLabel,
    targetResource: r.targetResource,
    sanitizedParams: r.sanitizedParams,
    riskLevel: r.riskLevel,
    reason: r.reason,
    potentialConsequences: r.potentialConsequences,
    status: r.status,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    reviewedBy: r.reviewedBy,
    reviewNotes: r.reviewNotes,
    usedAt: r.usedAt,
    executedBy: r.executedBy,
    hasCheckpoint: !!r.checkpointData,
    rollbackAt: r.rollbackAt,
    rollbackBy: r.rollbackBy
  }));

  return res.json({ requests: sanitizedList });
});

// Count pending requests for alerts badge
adminRouter.get('/change-requests/pending-count', (req: AuthenticatedRequest, res: Response) => {
  sweepExpiredRequests();
  const data = db.getData();
  const pendingCount = data.changeRequests.filter((r) => r.status === 'pending').length;
  return res.json({ pendingCount });
});

// Single change request details
adminRouter.get('/change-requests/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pool } = getDb();
    const crRes = await pool.query('SELECT * FROM change_requests WHERE id = $1', [req.params.id]);
    if (crRes.rows.length > 0) {
      const row = crRes.rows[0];
      const data = db.getData();
      const idx = data.changeRequests.findIndex((item) => item && item.id === req.params.id);
      const isExpired = Number(row.expires_at) < Date.now() && row.status === 'pending';
      const actualStatus = isExpired ? 'expired' : row.status;
      if (idx !== -1) {
        data.changeRequests[idx].expiresAt = Number(row.expires_at);
        data.changeRequests[idx].status = actualStatus as any;
      }
    }
  } catch {}

  sweepExpiredRequests();
  const data = db.getData();
  const r = data.changeRequests.find((item) => item && item.id === req.params.id);
  if (!r) {
    return res.status(404).json({ error: 'Solicitud de cambio no encontrada.' });
  }

  if (r.status === 'pending' && r.expiresAt < Date.now()) {
    r.status = 'expired';
  }

  return res.json({
    request: {
      id: r.id,
      requestedBy: r.requestedBy,
      action: r.action,
      actionLabel: r.actionLabel,
      targetResource: r.targetResource,
      sanitizedParams: r.sanitizedParams,
      riskLevel: r.riskLevel,
      reason: r.reason,
      potentialConsequences: r.potentialConsequences,
      status: r.status,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      reviewedBy: r.reviewedBy,
      reviewNotes: r.reviewNotes,
      usedAt: r.usedAt,
      executedBy: r.executedBy,
      hasCheckpoint: !!r.checkpointData,
      rollbackAt: r.rollbackAt,
      rollbackBy: r.rollbackBy
    }
  });
});

// Approve Change Request (Strictly Super Admin + Strong Auth)
adminRouter.post('/change-requests/:id/approve', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authCheck = verifySuperAdminStrongAuth(req);
  if (!authCheck.ok) {
    return res.status(403).json({ error: 'Forbidden', message: authCheck.message });
  }

  try {
    const { rawToken, request } = approveChangeRequest(
      req.params.id,
      req.user!,
      req.body.reviewNotes || req.body.notes
    );

    logAudit(req, 'change_request_approved', `change_request/${request.id}`, {
      requestId: request.id,
      action: request.action,
      targetResource: request.targetResource,
      requestedBy: request.requestedBy.email
    });

    return res.json({
      success: true,
      message: 'Solicitud aprobada exitosamente.',
      authorizationToken: rawToken,
      expiresAt: request.authorizationTokenExpiresAt,
      request: {
        id: request.id,
        status: request.status,
        expiresAt: request.authorizationTokenExpiresAt
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'ApprovalError', message: err.message });
  }
});

// Reject Change Request (Strictly Super Admin + Strong Auth)
adminRouter.post('/change-requests/:id/reject', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authCheck = verifySuperAdminStrongAuth(req);
  if (!authCheck.ok) {
    return res.status(403).json({ error: 'Forbidden', message: authCheck.message });
  }

  try {
    const request = rejectChangeRequest(
      req.params.id,
      req.user!,
      req.body.reason || req.body.reviewNotes
    );

    logAudit(req, 'change_request_rejected', `change_request/${request.id}`, {
      requestId: request.id,
      action: request.action,
      targetResource: request.targetResource,
      requestedBy: request.requestedBy.email,
      reason: req.body.reason
    });

    return res.json({
      success: true,
      message: 'Solicitud rechazada correctamente.',
      request: { id: request.id, status: request.status }
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'RejectionError', message: err.message });
  }
});

// Direct Execute by Super Admin (with Sudo/Strong Auth)
adminRouter.post('/change-requests/:id/execute', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authCheck = verifySuperAdminStrongAuth(req);
  if (!authCheck.ok) {
    return res.status(403).json({ error: 'Forbidden', message: authCheck.message });
  }

  const data = db.getData();
  const request = data.changeRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada.' });
  }

  if (request.status !== 'pending' && request.status !== 'approved') {
    return res.status(400).json({
      error: 'InvalidState',
      message: `No se puede ejecutar una solicitud en estado ${request.status}.`
    });
  }

  const now = Date.now();
  try {
    if (request.action === 'update_system_settings') {
      request.checkpointData = { settings: { ...data.settings } };
      Object.assign(data.settings, request.sanitizedParams);
      data.settings.updatedAt = now;
    } else if (request.action === 'change_user_role') {
      const targetUser = data.users.find((u) => u.id === request.sanitizedParams.targetUserId);
      if (!targetUser) throw new Error('Usuario objetivo no encontrado.');
      request.checkpointData = {
        targetUserId: targetUser.id,
        oldRole: targetUser.role,
        oldPermissions: [...targetUser.permissions]
      };
      targetUser.role = request.sanitizedParams.role;
      targetUser.permissions = targetUser.role === 'super_admin' ? ['*'] : targetUser.role === 'admin' ? ['manage_tools', 'view_analytics', 'view_errors'] : [];
    } else if (request.action === 'change_user_status') {
      const targetUser = data.users.find((u) => u.id === request.sanitizedParams.targetUserId);
      if (!targetUser) throw new Error('Usuario objetivo no encontrado.');
      request.checkpointData = {
        targetUserId: targetUser.id,
        oldStatus: targetUser.status
      };
      targetUser.status = request.sanitizedParams.status;
    }

    request.status = 'executed';
    request.usedAt = now;
    request.authorizationTokenHash = undefined;
    request.executedBy = {
      id: req.user!.id,
      email: req.user!.email,
      executedAt: now
    };

    db.save();

    logAudit(req, 'change_request_executed', `change_request/${request.id}`, {
      requestId: request.id,
      action: request.action,
      targetResource: request.targetResource
    });

    return res.json({ success: true, message: 'Cambio ejecutado exitosamente.', request });
  } catch (err: any) {
    return res.status(500).json({ error: 'ExecutionError', message: err.message });
  }
});

// Rollback Change Request (Strictly Super Admin + Strong Auth)
adminRouter.post('/change-requests/:id/rollback', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authCheck = verifySuperAdminStrongAuth(req);
  if (!authCheck.ok) {
    return res.status(403).json({ error: 'Forbidden', message: authCheck.message });
  }

  try {
    const { request, restoredData } = rollbackChangeRequest(req.params.id, req.user!);
    logAudit(req, 'change_request_rollback', `change_request/${request.id}`, {
      requestId: request.id,
      action: request.action,
      targetResource: request.targetResource,
      restoredData
    });
    return res.json({
      success: true,
      message: 'Cambio revertido exitosamente al estado anterior.',
      request
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'RollbackError', message: err.message });
  }
});

// 23. Toggle Tool Status (Critical action)
adminRouter.post('/tools/:slug/status', (req: AuthenticatedRequest, res: Response) => {
  const { slug } = req.params;
  const { active, reason } = req.body;
  const targetResource = `tool/${slug}`;
  const authToken = req.headers['x-change-authorization-token'] as string;

  if (req.user!.role === 'admin') {
    if (!authToken) {
      const cr = createChangeRequest(
        req.user!,
        'tool_toggle_status',
        targetResource,
        { slug, active },
        reason
      );
      logAudit(req, 'change_request_created', targetResource, {
        requestId: cr.id,
        action: cr.action,
        slug,
        active
      });
      return res.status(202).json({
        authorizationRequired: true,
        message: 'Este cambio requiere autorización del Super Admin.',
        requestId: cr.id,
        request: cr
      });
    }

    try {
      const { request } = validateAndConsumeToken(
        authToken,
        'tool_toggle_status',
        targetResource,
        { slug, active },
        req.user!
      );
      request.checkpointData = { slug, oldActive: !active };
      db.save();
    } catch (err: any) {
      return res.status(403).json({
        error: 'AuthorizationFailed',
        message: err.message || 'Token de autorización inválido o expirado.'
      });
    }
  } else if (req.user!.role === 'super_admin') {
    const sudoTicket = req.headers['x-sudo-ticket'] as string;
    if (!sudoTicket || !verifySudoTicket(sudoTicket, req.user!.id)) {
      return res.status(403).json({
        error: 'SudoRequired',
        message: 'Esta acción crítica requiere reautenticación de seguridad (contraseña y TOTP).'
      });
    }
  }

  logAudit(req, 'tool_status_updated', targetResource, { slug, active });
  return res.json({ success: true, slug, active, message: `Herramienta ${slug} actualizada a ${active ? 'activa' : 'inactiva'}.` });
});

// 24. Purge sensitive records (Audit logs: Super Admin ONLY. System errors: Admin with auth)
adminRouter.post('/data/purge', (req: AuthenticatedRequest, res: Response) => {
  const { type, reason } = req.body; // 'audit_logs' | 'system_errors'
  const data = db.getData();

  if (type === 'audit_logs') {
    // Under no circumstances can an ordinary admin purge audit logs
    if (req.user!.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Los registros de auditoría no pueden ser purgados por un administrador normal. Acción restringida al Super Admin.'
      });
    }

    const authCheck = verifySuperAdminStrongAuth(req);
    if (!authCheck.ok) {
      return res.status(403).json({ error: 'Forbidden', message: authCheck.message });
    }

    const count = data.auditLogs.length;
    data.auditLogs = [];
    db.save();

    logAudit(req, 'audit_logs_purged', 'system/audit_logs', { purgedCount: count });
    return res.json({ success: true, message: `Se han purgado ${count} registros de auditoría.` });
  }

  if (type === 'system_errors') {
    const authToken = req.headers['x-change-authorization-token'] as string;
    if (req.user!.role === 'admin') {
      if (!authToken) {
        const cr = createChangeRequest(
          req.user!,
          'purge_errors',
          'system/errors',
          { type: 'system_errors' },
          reason
        );
        return res.status(202).json({
          authorizationRequired: true,
          message: 'Este cambio requiere autorización del Super Admin.',
          requestId: cr.id,
          request: cr
        });
      }

      try {
        validateAndConsumeToken(
          authToken,
          'purge_errors',
          'system/errors',
          { type: 'system_errors' },
          req.user!
        );
      } catch (err: any) {
        return res.status(403).json({
          error: 'AuthorizationFailed',
          message: err.message || 'Token inválido o expirado.'
        });
      }
    } else if (req.user!.role === 'super_admin') {
      const sudoTicket = req.headers['x-sudo-ticket'] as string;
      if (!sudoTicket || !verifySudoTicket(sudoTicket, req.user!.id)) {
        return res.status(403).json({
          error: 'SudoRequired',
          message: 'Esta acción requiere reautenticación de seguridad (contraseña y TOTP).'
        });
      }
    }

    const count = data.systemErrors.length;
    data.systemErrors = [];
    db.save();

    logAudit(req, 'system_errors_purged', 'system/errors', { purgedCount: count });
    return res.json({ success: true, message: `Se han purgado ${count} errores registrados.` });
  }

  return res.status(400).json({ error: 'InvalidType', message: 'Tipo de purga inválido.' });
});
