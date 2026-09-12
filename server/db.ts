import fs from 'fs';
import path from 'path';
import { getDb, initializeDatabaseSchema } from './db/connection';
import type {
  UserRecord,
  SessionRecord,
  AnalyticsEventRecord,
  SystemErrorRecord,
  AuditLogRecord,
  AdminAlertRecord,
  ChangeRequestRecord,
  SystemSettingsRecord,
  DatabaseSchema,
  UserRole,
  ChangeRequestStatus
} from './db/types';

export * from './db/types';

class PostgresDatabase {
  private data: DatabaseSchema;
  private pool: any;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.data = this.getDefaultSchema();
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL) {
      const legacyDbFile = path.join(process.cwd(), 'data', 'toolbox_db.json');
      if (fs.existsSync(legacyDbFile)) {
        try {
          const raw = fs.readFileSync(legacyDbFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.users && Array.isArray(parsed.users)) {
            this.data = parsed;
          }
        } catch {
          // ignore and use default
        }
      }
    }

    const { pool } = getDb();
    this.pool = pool;

    // Initiate initialization and database sync
    this.initPromise = this.init().catch((err) => {
      console.error('[POSTGRES-DB] Fatal initialization error:', err);
    });
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      sessions: [],
      analyticsEvents: [],
      systemErrors: [],
      auditLogs: [],
      adminAlerts: [],
      changeRequests: [],
      settings: {
        adsEnabled: true,
        maintenanceMode: false,
        globalBannerText: 'Nueva actualización: 20 herramientas disponibles 100% privadas.',
        bannerEnabled: false,
        sessionTimeoutMinutes: 120,
        maxLoginAttempts: 5,
        lockoutMinutes: 15,
        updatedAt: Date.now()
      }
    };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await initializeDatabaseSchema(this.pool);

      // Check if system settings exist, if not insert defaults
      const settingsRes = await this.pool.query("SELECT * FROM system_settings WHERE id = 'singleton'");
      if (settingsRes.rows.length === 0) {
        await this.pool.query(
          `INSERT INTO system_settings (id, ads_enabled, maintenance_mode, global_banner_text, banner_enabled, session_timeout_minutes, max_login_attempts, lockout_minutes, updated_at)
           VALUES ('singleton', $1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            this.data.settings.adsEnabled,
            this.data.settings.maintenanceMode,
            this.data.settings.globalBannerText,
            this.data.settings.bannerEnabled,
            this.data.settings.sessionTimeoutMinutes,
            this.data.settings.maxLoginAttempts,
            this.data.settings.lockoutMinutes,
            this.data.settings.updatedAt
          ]
        );
      }

      // Check if we need to auto-migrate from legacy local JSON file (only if database has 0 users and running locally without PostgreSQL)
      const usersCountRes = await this.pool.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(usersCountRes.rows[0]?.count || '0', 10);

      const legacyDbFile = path.join(process.cwd(), 'data', 'toolbox_db.json');
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL && userCount === 0 && fs.existsSync(legacyDbFile)) {
        console.log('[POSTGRES-DB] Database is empty. Seeding initial records from local data...');
        try {
          const raw = fs.readFileSync(legacyDbFile, 'utf-8');
          const legacyData: DatabaseSchema = JSON.parse(raw);
          await this.importFromData(legacyData);
          console.log('[POSTGRES-DB] Initial data successfully seeded into PostgreSQL tables.');
        } catch (err) {
          console.error('[POSTGRES-DB] Error importing initial data:', err);
        }
      }

      // Load all tables into memory cache
      await this.syncFromPostgres();
      this.isInitialized = true;
      console.log('[POSTGRES-DB] PostgreSQL Database service initialized and ready.');
    } catch (err) {
      console.error('[POSTGRES-DB] Error during PostgreSQL initialization:', err);
    }
  }

  public async ensureReady(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  public async syncFromPostgres(): Promise<void> {
    try {
      // 1. Settings
      const setRes = await this.pool.query("SELECT * FROM system_settings WHERE id = 'singleton'");
      if (setRes.rows.length > 0) {
        const s = setRes.rows[0];
        this.data.settings = {
          adsEnabled: Boolean(s.ads_enabled),
          maintenanceMode: Boolean(s.maintenance_mode),
          globalBannerText: s.global_banner_text || '',
          bannerEnabled: Boolean(s.banner_enabled),
          sessionTimeoutMinutes: Number(s.session_timeout_minutes || 120),
          maxLoginAttempts: Number(s.max_login_attempts || 5),
          lockoutMinutes: Number(s.lockout_minutes || 15),
          updatedAt: Number(s.updated_at || Date.now())
        };
      }

      // 2. Users
      const uRes = await this.pool.query('SELECT * FROM users');
      this.data.users = uRes.rows.map((u: any): UserRecord => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.password_hash,
        salt: u.salt,
        role: u.role,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || []),
        totpSecret: u.totp_secret || undefined,
        totpEnabled: Boolean(u.totp_enabled),
        recoveryCodes: typeof u.recovery_codes === 'string' ? JSON.parse(u.recovery_codes) : (u.recovery_codes || []),
        status: u.status,
        createdAt: Number(u.created_at),
        lastLoginAt: u.last_login_at ? Number(u.last_login_at) : undefined,
        failedLoginAttempts: Number(u.failed_login_attempts || 0),
        lockedUntil: u.locked_until ? Number(u.locked_until) : undefined,
        resetPasswordTokenHash: u.reset_password_token_hash || undefined,
        resetPasswordExpiresAt: u.reset_password_expires_at ? Number(u.reset_password_expires_at) : undefined
      }));

      // 3. Sessions
      const sRes = await this.pool.query('SELECT * FROM sessions');
      this.data.sessions = sRes.rows.map((s: any): SessionRecord => ({
        id: s.id,
        userId: s.user_id,
        role: s.role,
        ip: s.ip,
        userAgent: s.user_agent,
        device: s.device,
        browser: s.browser,
        os: s.os,
        createdAt: Number(s.created_at),
        lastActivityAt: Number(s.last_activity_at),
        expiresAt: Number(s.expires_at),
        isValid: Boolean(s.is_valid)
      }));

      // 4. Change Requests
      const crRes = await this.pool.query('SELECT * FROM change_requests');
      this.data.changeRequests = crRes.rows.map((c: any): ChangeRequestRecord => ({
        id: c.id,
        requestedBy: typeof c.requested_by === 'string' ? JSON.parse(c.requested_by) : c.requested_by,
        action: c.action,
        actionLabel: c.action_label,
        targetResource: c.target_resource,
        sanitizedParams: typeof c.sanitized_params === 'string' ? JSON.parse(c.sanitized_params) : c.sanitized_params,
        paramsHash: c.params_hash,
        riskLevel: c.risk_level,
        reason: c.reason,
        potentialConsequences: c.potential_consequences,
        status: c.status,
        createdAt: Number(c.created_at),
        expiresAt: Number(c.expires_at),
        reviewedBy: c.reviewed_by ? (typeof c.reviewed_by === 'string' ? JSON.parse(c.reviewed_by) : c.reviewed_by) : undefined,
        reviewNotes: c.review_notes || undefined,
        authorizationTokenHash: c.authorization_token_hash || undefined,
        authorizationTokenExpiresAt: c.authorization_token_expires_at ? Number(c.authorization_token_expires_at) : undefined,
        usedAt: c.used_at ? Number(c.used_at) : undefined,
        executedBy: c.executed_by ? (typeof c.executed_by === 'string' ? JSON.parse(c.executed_by) : c.executed_by) : undefined,
        checkpointData: c.checkpoint_data ? (typeof c.checkpoint_data === 'string' ? JSON.parse(c.checkpoint_data) : c.checkpoint_data) : undefined,
        rollbackAt: c.rollback_at ? Number(c.rollback_at) : undefined,
        rollbackBy: c.rollback_by ? (typeof c.rollback_by === 'string' ? JSON.parse(c.rollback_by) : c.rollback_by) : undefined
      }));

      // 5. Audit Logs
      const aRes = await this.pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');
      this.data.auditLogs = aRes.rows.map((a: any): AuditLogRecord => ({
        id: a.id,
        timestamp: Number(a.timestamp),
        actorId: a.actor_id,
        actorEmail: a.actor_email,
        actorRole: a.actor_role,
        action: a.action,
        targetResource: a.target_resource,
        details: typeof a.details === 'string' ? JSON.parse(a.details) : a.details,
        ip: a.ip,
        status: a.status
      }));

      // 6. Admin Alerts
      const alRes = await this.pool.query('SELECT * FROM admin_alerts ORDER BY timestamp DESC LIMIT 100');
      this.data.adminAlerts = alRes.rows.map((al: any): AdminAlertRecord => ({
        id: al.id,
        timestamp: Number(al.timestamp),
        severity: al.severity,
        type: al.type,
        message: al.message,
        read: Boolean(al.read),
        resolvedAt: al.resolved_at ? Number(al.resolved_at) : undefined
      }));

      // 7. System Errors
      const errRes = await this.pool.query('SELECT * FROM system_errors ORDER BY last_seen_at DESC LIMIT 100');
      this.data.systemErrors = errRes.rows.map((e: any): SystemErrorRecord => ({
        id: e.id,
        timestamp: Number(e.timestamp),
        tool: e.tool || undefined,
        errorType: e.error_type,
        technicalMessage: e.technical_message,
        endpoint: e.endpoint || undefined,
        browser: e.browser || undefined,
        status: e.status,
        frequency: Number(e.frequency || 1),
        lastSeenAt: Number(e.last_seen_at)
      }));

      // 8. Analytics Events
      const evRes = await this.pool.query('SELECT * FROM analytics_events ORDER BY timestamp DESC LIMIT 200');
      this.data.analyticsEvents = evRes.rows.map((ev: any): AnalyticsEventRecord => ({
        id: ev.id,
        type: ev.type,
        toolSlug: ev.tool_slug || undefined,
        category: ev.category || undefined,
        durationMs: ev.duration_ms ? Number(ev.duration_ms) : undefined,
        status: ev.status || undefined,
        errorType: ev.error_type || undefined,
        path: ev.path || undefined,
        ipHash: ev.ip_hash || undefined,
        userAgent: ev.user_agent || undefined,
        timestamp: Number(ev.timestamp)
      }));
    } catch (err) {
      console.error('[POSTGRES-DB] Error reading from PostgreSQL tables:', err);
    }
  }

  public async importFromData(data: Partial<DatabaseSchema>): Promise<void> {
    if (data.settings) {
      await this.pool.query(
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
          data.settings.updatedAt
        ]
      );
    }

    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        await this.pool.query(
          `INSERT INTO users (id, name, email, password_hash, salt, role, permissions, totp_secret, totp_enabled, recovery_codes, status, created_at, last_login_at, failed_login_attempts, locked_until, reset_password_token_hash, reset_password_expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
             locked_until = EXCLUDED.locked_until,
             reset_password_token_hash = EXCLUDED.reset_password_token_hash,
             reset_password_expires_at = EXCLUDED.reset_password_expires_at`,
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
            u.lockedUntil || null,
            u.resetPasswordTokenHash || null,
            u.resetPasswordExpiresAt || null
          ]
        );
      }
    }

    if (data.changeRequests && data.changeRequests.length > 0) {
      for (const cr of data.changeRequests) {
        await this.pool.query(
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
      }
    }

    if (data.auditLogs && data.auditLogs.length > 0) {
      for (const al of data.auditLogs) {
        await this.pool.query(
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
      }
    }
  }

  private lastFileMtime: number = 0;

  public getData(): DatabaseSchema {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL) {
      const legacyDbFile = path.join(process.cwd(), 'data', 'toolbox_db.json');
      if (fs.existsSync(legacyDbFile)) {
        try {
          const mtime = fs.statSync(legacyDbFile).mtimeMs;
          if (mtime > this.lastFileMtime) {
            const raw = fs.readFileSync(legacyDbFile, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.users && Array.isArray(parsed.users)) {
              this.data = parsed;
              this.lastFileMtime = mtime;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    return this.data;
  }

  public save(): void {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL) {
      try {
        const legacyDbFile = path.join(process.cwd(), 'data', 'toolbox_db.json');
        fs.writeFileSync(legacyDbFile, JSON.stringify(this.data, null, 2), 'utf-8');
        this.lastFileMtime = fs.statSync(legacyDbFile).mtimeMs;
      } catch {
        // ignore
      }
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // In Serverless or production with database, sync immediately without delay
    if (process.env.VERCEL || process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      this.syncToPostgres().catch((err) => {
        console.error('[POSTGRES-DB] Immediate sync error:', err);
      });
      return;
    }

    this.saveTimeout = setTimeout(() => {
      this.syncToPostgres().catch((err) => {
        console.error('[POSTGRES-DB] Background save error:', err);
      });
    }, 100);
  }

  public flushSync(): void {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.VERCEL) {
      try {
        const legacyDbFile = path.join(process.cwd(), 'data', 'toolbox_db.json');
        fs.writeFileSync(legacyDbFile, JSON.stringify(this.data, null, 2), 'utf-8');
        this.lastFileMtime = fs.statSync(legacyDbFile).mtimeMs;
      } catch {
        // ignore
      }
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.syncToPostgres().catch((err) => {
      console.error('[POSTGRES-DB] Flush error:', err);
    });
  }

  public async syncToPostgres(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Settings
      await this.pool.query(
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
          this.data.settings.adsEnabled,
          this.data.settings.maintenanceMode,
          this.data.settings.globalBannerText,
          this.data.settings.bannerEnabled,
          this.data.settings.sessionTimeoutMinutes,
          this.data.settings.maxLoginAttempts,
          this.data.settings.lockoutMinutes,
          this.data.settings.updatedAt
        ]
      );

      // 2. Users
      for (const u of this.data.users) {
        await this.pool.query(
          `INSERT INTO users (id, name, email, password_hash, salt, role, permissions, totp_secret, totp_enabled, recovery_codes, status, created_at, last_login_at, failed_login_attempts, locked_until, reset_password_token_hash, reset_password_expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
             locked_until = EXCLUDED.locked_until,
             reset_password_token_hash = EXCLUDED.reset_password_token_hash,
             reset_password_expires_at = EXCLUDED.reset_password_expires_at`,
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
            u.lockedUntil || null,
            u.resetPasswordTokenHash || null,
            u.resetPasswordExpiresAt || null
          ]
        );
      }

      // 3. Sessions
      for (const s of this.data.sessions) {
        await this.pool.query(
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
      }

      // 4. Change Requests
      for (const cr of this.data.changeRequests) {
        await this.pool.query(
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
      }

      // 5. Audit Logs
      for (const al of this.data.auditLogs) {
        await this.pool.query(
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
      }

      // 6. Admin Alerts
      for (const alert of this.data.adminAlerts) {
        await this.pool.query(
          `INSERT INTO admin_alerts (id, timestamp, severity, type, message, read, resolved_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             read = EXCLUDED.read,
             resolved_at = EXCLUDED.resolved_at`,
          [
            alert.id,
            alert.timestamp,
            alert.severity,
            alert.type,
            alert.message,
            Boolean(alert.read),
            alert.resolvedAt || null
          ]
        );
      }
    } catch (err) {
      console.error('[POSTGRES-DB] Error persisting state to PostgreSQL:', err);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const db = new PostgresDatabase();
