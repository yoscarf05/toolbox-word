import crypto from 'crypto';
import { db, UserRecord, ChangeRequestRecord, ChangeRequestStatus, UserRole } from './db';
import { getDb } from './db/connection';
import { AuthenticatedRequest, logAudit } from './middleware';

export interface CriticalActionDefinition {
  action: string;
  label: string;
  defaultRiskLevel: 'critical' | 'high';
  consequences: string;
}

export const CRITICAL_ACTIONS: Record<string, CriticalActionDefinition> = {
  update_system_settings: {
    action: 'update_system_settings',
    label: 'Modificar Configuración del Sistema / Producción',
    defaultRiskLevel: 'critical',
    consequences: 'Puede alterar límites de sesión, bloqueos de seguridad, modo de mantenimiento y comportamiento global del servidor.'
  },
  toggle_maintenance: {
    action: 'toggle_maintenance',
    label: 'Activar/Desactivar Modo de Mantenimiento',
    defaultRiskLevel: 'critical',
    consequences: 'Interrumpe o restablece el acceso público al catálogo de herramientas para todos los usuarios.'
  },
  toggle_ads: {
    action: 'toggle_ads',
    label: 'Modificar Configuración de AdSense / Publicidad',
    defaultRiskLevel: 'high',
    consequences: 'Afecta la monetización y el renderizado de bloques de anuncios en las páginas públicas.'
  },
  change_user_role: {
    action: 'change_user_role',
    label: 'Modificar Roles o Permisos Sensibles de Usuario',
    defaultRiskLevel: 'critical',
    consequences: 'Otorga o revoca privilegios administrativos con acceso a información y controles sensibles.'
  },
  change_user_status: {
    action: 'change_user_status',
    label: 'Bloquear/Desbloquear Cuenta Administrativa',
    defaultRiskLevel: 'critical',
    consequences: 'Inhabilita inmediatamente el acceso de una cuenta administrativa y revoca sus sesiones.'
  },
  tool_toggle_status: {
    action: 'tool_toggle_status',
    label: 'Desactivar o Reactivar Herramienta Principal',
    defaultRiskLevel: 'critical',
    consequences: 'Impide que los usuarios accedan y ejecuten conversiones con la herramienta seleccionada.'
  },
  purge_logs: {
    action: 'purge_logs',
    label: 'Purgar Registros de Auditoría del Sistema',
    defaultRiskLevel: 'critical',
    consequences: 'Elimina permanentemente registros históricos de trazabilidad y seguridad.'
  },
  purge_errors: {
    action: 'purge_errors',
    label: 'Purgar Registros de Errores del Sistema',
    defaultRiskLevel: 'high',
    consequences: 'Elimina diagnósticos de fallas técnicas recientes.'
  },
  database_migration: {
    action: 'database_migration',
    label: 'Ejecutar Migración de Base de Datos / Checkpoint',
    defaultRiskLevel: 'critical',
    consequences: 'Modifica o reestructura datos persistentes en el almacenamiento del servidor.'
  }
};

/**
 * Remove any passwords, secrets, hashes or tokens before storing in request params
 */
export function sanitizeParams(params: any): Record<string, any> {
  if (!params || typeof params !== 'object') return {};
  const sanitized: Record<string, any> = {};
  const secretKeywords = ['password', 'secret', 'hash', 'salt', 'token', 'jwt', 'cookie', 'code'];

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (secretKeywords.some((kw) => lowerKey.includes(kw))) {
      sanitized[key] = '[PROTEGIDO]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeParams(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Computes deterministic SHA-256 hash of parameters for integrity verification
 */
export function computeParamsHash(params: any): string {
  const sanitized = sanitizeParams(params);
  const json = JSON.stringify(sanitized, Object.keys(sanitized).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Creates an authorization change request for a critical action
 */
export function createChangeRequest(
  actor: UserRecord,
  action: string,
  targetResource: string,
  params: any,
  customReason?: string
): ChangeRequestRecord {
  // Prevent admin from self-elevating or modifying own permissions
  if (action === 'change_user_role') {
    if (params.role === 'super_admin' && actor.role !== 'super_admin') {
      throw new Error('Un administrador no puede elevarse a Super Administrador.');
    }
    if (params.targetUserId === actor.id && actor.role !== 'super_admin') {
      throw new Error('Un administrador no puede modificar sus propios permisos ni rol.');
    }
  }

  const def = CRITICAL_ACTIONS[action] || {
    action,
    label: action,
    defaultRiskLevel: 'critical',
    consequences: 'Modificación crítica que puede alterar el comportamiento o la disponibilidad del sistema.'
  };

  const id = `crq_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();
  const sanitized = sanitizeParams(params);
  const paramsHash = computeParamsHash(params);

  const newRequest: ChangeRequestRecord = {
    id,
    requestedBy: {
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: actor.role
    },
    action,
    actionLabel: def.label,
    targetResource,
    sanitizedParams: sanitized,
    paramsHash,
    riskLevel: def.defaultRiskLevel,
    reason: customReason || (params && params.reason) || 'Modificación administrativa crítica solicitada para aprobación.',
    potentialConsequences: def.consequences,
    status: 'pending',
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours to review
  };

  const data = db.getData();
  data.changeRequests.unshift(newRequest);

  // Keep last 1000 change requests
  if (data.changeRequests.length > 1000) {
    data.changeRequests.length = 1000;
  }

  // Create real-time Admin Alert
  data.adminAlerts.unshift({
    id: `alt_${now}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    severity: 'critical',
    type: 'change_request_pending',
    message: `Hay una solicitud de cambio crítico pendiente: ${def.label} (${targetResource})`,
    read: false
  });

  try {
    const { pool } = getDb();
    pool.query(
      `INSERT INTO change_requests (id, requested_by, action, action_label, target_resource, sanitized_params, params_hash, risk_level, reason, potential_consequences, status, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         expires_at = EXCLUDED.expires_at`,
      [
        newRequest.id,
        JSON.stringify(newRequest.requestedBy),
        newRequest.action,
        newRequest.actionLabel,
        newRequest.targetResource,
        JSON.stringify(newRequest.sanitizedParams),
        newRequest.paramsHash,
        newRequest.riskLevel,
        newRequest.reason,
        newRequest.potentialConsequences,
        newRequest.status,
        newRequest.createdAt,
        newRequest.expiresAt
      ]
    ).catch(() => {});
  } catch {}

  db.flushSync();

  return newRequest;
}

/**
 * Approve a change request.
 * Strictly restricted to Super Admin with strong auth.
 * Generates a single-use, non-reusable, cryptographically secure token.
 */
export function approveChangeRequest(
  requestId: string,
  superAdminUser: UserRecord,
  reviewNotes?: string
): { rawToken: string; request: ChangeRequestRecord } {
  if (superAdminUser.role !== 'super_admin') {
    throw new Error('Solo el Super Administrador puede aprobar solicitudes de cambios críticos.');
  }

  const data = db.getData();
  const request = data.changeRequests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error('Solicitud de cambio no encontrada.');
  }

  if (request.status !== 'pending') {
    throw new Error(`La solicitud no está pendiente (estado actual: ${request.status}).`);
  }

  const now = Date.now();
  if (request.expiresAt < now) {
    request.status = 'expired';
    db.save();
    throw new Error('La solicitud de cambio ha expirado.');
  }

  // Generate cryptographically secure token
  const rawToken = `cat_${crypto.randomBytes(32).toString('hex')}`;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  request.status = 'approved';
  request.authorizationTokenHash = tokenHash;
  // Short expiration for execution: 15 minutes
  request.authorizationTokenExpiresAt = now + 15 * 60 * 1000;
  request.reviewedBy = {
    id: superAdminUser.id,
    name: superAdminUser.name,
    email: superAdminUser.email,
    reviewedAt: now
  };
  request.reviewNotes = reviewNotes || 'Aprobada por Super Administrador.';

  db.save();

  return { rawToken, request };
}

/**
 * Reject a change request.
 */
export function rejectChangeRequest(
  requestId: string,
  superAdminUser: UserRecord,
  reason?: string
): ChangeRequestRecord {
  if (superAdminUser.role !== 'super_admin') {
    throw new Error('Solo el Super Administrador puede rechazar solicitudes de cambios críticos.');
  }

  const data = db.getData();
  const request = data.changeRequests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error('Solicitud de cambio no encontrada.');
  }

  if (request.status !== 'pending') {
    throw new Error(`La solicitud no está pendiente (estado actual: ${request.status}).`);
  }

  request.status = 'rejected';
  request.reviewedBy = {
    id: superAdminUser.id,
    name: superAdminUser.name,
    email: superAdminUser.email,
    reviewedAt: Date.now()
  };
  request.reviewNotes = reason || 'Rechazada por Super Administrador.';

  db.save();

  return request;
}

/**
 * Validate and consume a single-use authorization token.
 * Immediately invalidates the token, preventing any reuse or use on another request.
 */
export function validateAndConsumeToken(
  rawToken: string,
  expectedAction: string,
  expectedResource: string,
  currentParams: any,
  actor: UserRecord
): { request: ChangeRequestRecord } {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Token de autorización no provisto.');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  const data = db.getData();
  const request = data.changeRequests.find((r) => r.authorizationTokenHash === tokenHash);

  if (!request) {
    // Check if it was already used
    const alreadyUsed = data.changeRequests.find((r) => r.usedAt && r.status === 'executed');
    throw new Error('Token de autorización inválido, inexistente o ya utilizado.');
  }

  if (request.status !== 'approved') {
    throw new Error(`La solicitud no está en estado aprobado (estado actual: ${request.status}).`);
  }

  const now = Date.now();
  if (request.authorizationTokenExpiresAt && request.authorizationTokenExpiresAt < now) {
    request.status = 'expired';
    request.authorizationTokenHash = undefined;
    db.save();
    throw new Error('El token de autorización ha expirado.');
  }

  if (request.action !== expectedAction) {
    throw new Error(`El token fue emitido para una acción distinta (${request.action} vs ${expectedAction}).`);
  }

  if (request.targetResource !== expectedResource) {
    throw new Error(`El token fue emitido para un recurso distinto (${request.targetResource} vs ${expectedResource}).`);
  }

  // Verify parameters integrity
  const currentParamsHash = computeParamsHash(currentParams);
  if (currentParamsHash !== request.paramsHash) {
    throw new Error('Los parámetros de la acción no coinciden con los autorizados en la solicitud.');
  }

  // CONSUME & INVALIDATE IMMEDIATELY: Single-use guarantee
  request.status = 'executed';
  request.usedAt = now;
  request.authorizationTokenHash = undefined; // Nullified permanently
  request.authorizationTokenExpiresAt = undefined;
  request.executedBy = {
    id: actor.id,
    email: actor.email,
    executedAt: now
  };

  db.save();

  return { request };
}

/**
 * Revert / Rollback an executed change using its checkpoint data
 */
export function rollbackChangeRequest(
  requestId: string,
  superAdminUser: UserRecord
): { request: ChangeRequestRecord; restoredData: any } {
  if (superAdminUser.role !== 'super_admin') {
    throw new Error('Solo el Super Administrador puede ejecutar rollbacks de cambios críticos.');
  }

  const data = db.getData();
  const request = data.changeRequests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error('Solicitud no encontrada.');
  }

  if (request.status !== 'executed') {
    throw new Error(`Solo se pueden revertir solicitudes en estado ejecutado (estado actual: ${request.status}).`);
  }

  if (!request.checkpointData) {
    throw new Error('No existe un checkpoint de respaldo disponible para esta solicitud.');
  }

  // Restore snapshot according to action
  const checkpoint = request.checkpointData;
  if (request.action === 'update_system_settings' || request.action === 'toggle_maintenance' || request.action === 'toggle_ads') {
    if (checkpoint.settings) {
      data.settings = { ...data.settings, ...checkpoint.settings };
    }
  } else if (request.action === 'change_user_role') {
    const target = data.users.find((u) => u.id === checkpoint.targetUserId);
    if (target && checkpoint.oldRole) {
      target.role = checkpoint.oldRole;
      target.permissions = checkpoint.oldPermissions || [];
    }
  } else if (request.action === 'change_user_status') {
    const target = data.users.find((u) => u.id === checkpoint.targetUserId);
    if (target && checkpoint.oldStatus) {
      target.status = checkpoint.oldStatus;
    }
  }

  request.status = 'rolled_back';
  request.rollbackAt = Date.now();
  request.rollbackBy = {
    id: superAdminUser.id,
    email: superAdminUser.email
  };

  db.save();

  return { request, restoredData: checkpoint };
}

/**
 * Sweep expired requests
 */
export function sweepExpiredRequests(): number {
  const data = db.getData();
  const now = Date.now();
  let count = 0;

  for (const req of data.changeRequests) {
    if (req.status === 'pending' && req.expiresAt < now) {
      req.status = 'expired';
      count++;
    } else if (req.status === 'approved' && req.authorizationTokenExpiresAt && req.authorizationTokenExpiresAt < now) {
      req.status = 'expired';
      req.authorizationTokenHash = undefined;
      count++;
    }
  }

  if (count > 0) {
    db.save();
  }

  return count;
}
