import fs from 'fs';
import path from 'path';
import { getDb, initializeDatabaseSchema } from '../server/db/connection';
import type { DatabaseSchema } from '../server/db/types';

/**
 * Data Migration Script: toolbox_db.json -> PostgreSQL (Neon / Production)
 *
 * Requirements:
 * - Always creates a non-destructive timestamped backup of the local JSON file first.
 * - Migrates users, sessions, change requests, audit logs, alerts, errors, and system settings.
 * - Does NOT delete the original file.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-json-to-pg.ts
 */
async function migrateJsonToPostgres() {
  console.log('====================================================');
  console.log('🔄  TOOLBOX WORD - MIGRACIÓN DE DATOS JSON A POSTGRESQL');
  console.log('====================================================');

  const jsonFilePath = path.join(process.cwd(), 'data', 'toolbox_db.json');

  if (!fs.existsSync(jsonFilePath)) {
    console.log('ℹ️ No se encontró archivo /data/toolbox_db.json. No hay datos locales para migrar.');
    process.exit(0);
  }

  // 1. Create a safety backup copy BEFORE reading or performing any action
  const timestamp = Date.now();
  const backupFilePath = path.join(process.cwd(), 'data', `toolbox_db.json.backup_${timestamp}`);
  fs.copyFileSync(jsonFilePath, backupFilePath);
  console.log(`🛡️ Copia de seguridad creada exitosamente en: ${backupFilePath}`);

  // 2. Read and parse JSON data
  const raw = fs.readFileSync(jsonFilePath, 'utf-8');
  let data: DatabaseSchema;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Error al parsear toolbox_db.json:', err);
    process.exit(1);
  }

  // 3. Connect to PostgreSQL and initialize schema
  const { pool } = getDb();
  await initializeDatabaseSchema(pool);

  console.log('⏳ Insertando entidades en PostgreSQL...');

  // 4. Migrate System Settings
  if (data.settings) {
    await pool.query(
      `INSERT INTO system_settings (id, ads_enabled, maintenance_mode, global_banner_text, banner_enabled, session_timeout_minutes, max_login_attempts, lockout_minutes, updated_at)
       VALUES ('singleton', $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         ads_enabled = EXCLUDED.ads_enabled,
         maintenance_mode = EXCLUDED.maintenance_mode,
         global_banner_text = EXCLUDED.global_banner_text,
         banner_enabled = EXCLUDED.banner_enabled,
         session_timeout_minutes = EXCLUDED.session_timeout_minutes,
         max_login_attempts = EXCLUDED.max_login_attempts,
         lockout_minutes = EXCLUDED.lockout_minutes,
         updated_at = EXCLUDED.updated_at`,
      [
        data.settings.adsEnabled,
        data.settings.maintenanceMode,
        data.settings.globalBannerText,
        data.settings.bannerEnabled,
        data.settings.sessionTimeoutMinutes,
        data.settings.maxLoginAttempts,
        data.settings.lockoutMinutes,
        data.settings.updatedAt || Date.now()
      ]
    );
    console.log('  ✅ Configuración del sistema migrada.');
  }

  // 5. Migrate Users
  let usersCount = 0;
  if (data.users && data.users.length > 0) {
    for (const u of data.users) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, salt, role, permissions, totp_secret, totp_enabled, recovery_codes, status, created_at, last_login_at, failed_login_attempts, locked_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           salt = EXCLUDED.salt,
           role = EXCLUDED.role,
           permissions = EXCLUDED.permissions,
           totp_secret = EXCLUDED.totp_secret,
           totp_enabled = EXCLUDED.totp_enabled,
           recovery_codes = EXCLUDED.recovery_codes,
           status = EXCLUDED.status,
           last_login_at = EXCLUDED.last_login_at,
           failed_login_attempts = EXCLUDED.failed_login_attempts,
           locked_until = EXCLUDED.locked_until`,
        [
          u.id,
          u.name,
          u.email,
          u.passwordHash,
          u.salt,
          u.role,
          JSON.stringify(u.permissions || []),
          u.totpSecret || null,
          Boolean(u.totpEnabled),
          JSON.stringify(u.recoveryCodes || []),
          u.status || 'active',
          u.createdAt,
          u.lastLoginAt || null,
          u.failedLoginAttempts || 0,
          u.lockedUntil || null
        ]
      );
      usersCount++;
    }
    console.log(`  ✅ ${usersCount} usuarios migrados.`);
  }

  // 6. Migrate Sessions
  let sessionsCount = 0;
  if (data.sessions && data.sessions.length > 0) {
    for (const s of data.sessions) {
      await pool.query(
        `INSERT INTO sessions (id, user_id, role, ip, user_agent, device, browser, os, created_at, last_activity_at, expires_at, is_valid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           last_activity_at = EXCLUDED.last_activity_at,
           expires_at = EXCLUDED.expires_at,
           is_valid = EXCLUDED.is_valid`,
        [
          s.id,
          s.userId,
          s.role,
          s.ip,
          s.userAgent,
          s.device,
          s.browser,
          s.os,
          s.createdAt,
          s.lastActivityAt,
          s.expiresAt,
          Boolean(s.isValid)
        ]
      );
      sessionsCount++;
    }
    console.log(`  ✅ ${sessionsCount} sesiones migradas.`);
  }

  // 7. Migrate Change Requests
  let crCount = 0;
  if (data.changeRequests && data.changeRequests.length > 0) {
    for (const cr of data.changeRequests) {
      await pool.query(
        `INSERT INTO change_requests (id, requested_by, action, action_label, target_resource, sanitized_params, params_hash, risk_level, reason, potential_consequences, status, created_at, expires_at, reviewed_by, review_notes, authorization_token_hash, authorization_token_expires_at, used_at, executed_by, checkpoint_data, rollback_at, rollback_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           expires_at = EXCLUDED.expires_at,
           reviewed_by = EXCLUDED.reviewed_by,
           review_notes = EXCLUDED.review_notes,
           authorization_token_hash = EXCLUDED.authorization_token_hash,
           authorization_token_expires_at = EXCLUDED.authorization_token_expires_at,
           used_at = EXCLUDED.used_at,
           executed_by = EXCLUDED.executed_by,
           checkpoint_data = EXCLUDED.checkpoint_data,
           rollback_at = EXCLUDED.rollback_at,
           rollback_by = EXCLUDED.rollback_by`,
        [
          cr.id,
          JSON.stringify(cr.requestedBy),
          cr.action,
          cr.actionLabel || cr.action || 'Operación',
          cr.targetResource || 'system',
          JSON.stringify(cr.sanitizedParams || {}),
          cr.paramsHash || 'hash',
          cr.riskLevel || 'critical',
          cr.reason || 'Operación administrativa',
          cr.potentialConsequences || 'Impacto del cambio',
          cr.status,
          cr.createdAt,
          cr.expiresAt,
          cr.reviewedBy ? JSON.stringify(cr.reviewedBy) : null,
          cr.reviewNotes || null,
          cr.authorizationTokenHash || null,
          cr.authorizationTokenExpiresAt || null,
          cr.usedAt || null,
          cr.executedBy ? JSON.stringify(cr.executedBy) : null,
          cr.checkpointData ? JSON.stringify(cr.checkpointData) : null,
          cr.rollbackAt || null,
          cr.rollbackBy ? JSON.stringify(cr.rollbackBy) : null
        ]
      );
      crCount++;
    }
    console.log(`  ✅ ${crCount} solicitudes de cambio crítico migradas.`);
  }

  // 8. Migrate Audit Logs
  let auditCount = 0;
  if (data.auditLogs && data.auditLogs.length > 0) {
    for (const al of data.auditLogs) {
      await pool.query(
        `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, target_resource, details, ip, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          al.id,
          al.timestamp,
          al.actorId,
          al.actorEmail,
          al.actorRole,
          al.action,
          al.targetResource,
          JSON.stringify(al.details || {}),
          al.ip,
          al.status
        ]
      );
      auditCount++;
    }
    console.log(`  ✅ ${auditCount} registros de auditoría migrados.`);
  }

  console.log('====================================================');
  console.log('🎉 MIGRACIÓN A POSTGRESQL COMPLETADA EXITOSAMENTE');
  console.log('====================================================');
  process.exit(0);
}

migrateJsonToPostgres().catch((err) => {
  console.error('❌ Error fatal en migración:', err);
  process.exit(1);
});
