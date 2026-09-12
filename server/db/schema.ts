import { pgTable, text, boolean, bigint, integer, jsonb } from 'drizzle-orm/pg-core';
import type { UserRole, ChangeRequestStatus } from './types';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  role: text('role').$type<UserRole>().notNull().default('user'),
  permissions: jsonb('permissions').$type<string[]>().notNull().default([]),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  recoveryCodes: jsonb('recovery_codes').$type<string[]>().notNull().default([]),
  status: text('status').$type<'active' | 'blocked'>().notNull().default('active'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  lastLoginAt: bigint('last_login_at', { mode: 'number' }),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: bigint('locked_until', { mode: 'number' })
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  role: text('role').$type<UserRole>().notNull(),
  ip: text('ip').notNull(),
  userAgent: text('user_agent').notNull(),
  device: text('device').notNull(),
  browser: text('browser').notNull(),
  os: text('os').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  lastActivityAt: bigint('last_activity_at', { mode: 'number' }).notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  isValid: boolean('is_valid').notNull().default(true)
});

export const changeRequests = pgTable('change_requests', {
  id: text('id').primaryKey(),
  requestedBy: jsonb('requested_by').$type<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }>().notNull(),
  action: text('action').notNull(),
  actionLabel: text('action_label').notNull(),
  targetResource: text('target_resource').notNull(),
  sanitizedParams: jsonb('sanitized_params').$type<Record<string, any>>().notNull(),
  paramsHash: text('params_hash').notNull(),
  riskLevel: text('risk_level').$type<'critical' | 'high'>().notNull(),
  reason: text('reason').notNull(),
  potentialConsequences: text('potential_consequences').notNull(),
  status: text('status').$type<ChangeRequestStatus>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  reviewedBy: jsonb('reviewed_by').$type<{
    id: string;
    name: string;
    email: string;
    reviewedAt: number;
  }>(),
  reviewNotes: text('review_notes'),
  authorizationTokenHash: text('authorization_token_hash'),
  authorizationTokenExpiresAt: bigint('authorization_token_expires_at', { mode: 'number' }),
  usedAt: bigint('used_at', { mode: 'number' }),
  executedBy: jsonb('executed_by').$type<{
    id: string;
    email: string;
    executedAt: number;
  }>(),
  checkpointData: jsonb('checkpoint_data').$type<Record<string, any>>(),
  rollbackAt: bigint('rollback_at', { mode: 'number' }),
  rollbackBy: jsonb('rollback_by').$type<{
    id: string;
    email: string;
  }>()
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  actorId: text('actor_id').notNull(),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').$type<UserRole>().notNull(),
  action: text('action').notNull(),
  targetResource: text('target_resource').notNull(),
  details: jsonb('details').$type<Record<string, any>>().notNull(),
  ip: text('ip').notNull(),
  status: text('status').$type<'success' | 'denied'>().notNull()
});

export const adminAlerts = pgTable('admin_alerts', {
  id: text('id').primaryKey(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  severity: text('severity').$type<'info' | 'warning' | 'critical'>().notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  resolvedAt: bigint('resolved_at', { mode: 'number' })
});

export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  toolSlug: text('tool_slug'),
  category: text('category'),
  durationMs: integer('duration_ms'),
  status: text('status').$type<'success' | 'failed'>(),
  errorType: text('error_type'),
  path: text('path'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull()
});

export const systemErrors = pgTable('system_errors', {
  id: text('id').primaryKey(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  tool: text('tool'),
  errorType: text('error_type').notNull(),
  technicalMessage: text('technical_message').notNull(),
  endpoint: text('endpoint'),
  browser: text('browser'),
  status: text('status').$type<'new' | 'investigating' | 'resolved' | 'ignored'>().notNull().default('new'),
  frequency: integer('frequency').notNull().default(1),
  lastSeenAt: bigint('last_seen_at', { mode: 'number' }).notNull()
});

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('singleton'),
  adsEnabled: boolean('ads_enabled').notNull().default(true),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  globalBannerText: text('global_banner_text').notNull().default('Nueva actualización: 20 herramientas disponibles 100% privadas.'),
  bannerEnabled: boolean('banner_enabled').notNull().default(false),
  sessionTimeoutMinutes: integer('session_timeout_minutes').notNull().default(120),
  maxLoginAttempts: integer('max_login_attempts').notNull().default(5),
  lockoutMinutes: integer('lockout_minutes').notNull().default(15),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull()
});

export const feedbackAndReports = pgTable('feedback_and_reports', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  userId: text('user_id'),
  email: text('email'),
  toolSlug: text('tool_slug'),
  message: text('message').notNull(),
  rating: integer('rating'),
  status: text('status').notNull().default('pending'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull()
});
