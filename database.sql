-- ====================================================================
-- ESQUEMA COMPLETO PARA NEON POSTGRESQL - TOOLBOX WORD
-- Ejecuta este script en Neon Console -> SQL Editor para crear todas las tablas.
-- ====================================================================

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '[]'::jsonb,
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  recovery_codes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at BIGINT NOT NULL,
  last_login_at BIGINT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until BIGINT,
  reset_password_token_hash TEXT,
  reset_password_expires_at BIGINT
);

-- 2. TABLA DE SESIONES
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  device TEXT NOT NULL,
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  last_activity_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. TABLA DE SOLICITUDES DE CAMBIO CRÍTICAS (AUTORIZACIÓN DUAL / ROLLBACK)
CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  requested_by JSONB NOT NULL,
  action TEXT NOT NULL,
  action_label TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  sanitized_params JSONB NOT NULL,
  params_hash TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  reason TEXT NOT NULL,
  potential_consequences TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  reviewed_by JSONB,
  review_notes TEXT,
  authorization_token_hash TEXT,
  authorization_token_expires_at BIGINT,
  used_at BIGINT,
  executed_by JSONB,
  checkpoint_data JSONB,
  rollback_at BIGINT,
  rollback_by JSONB
);

-- 4. TABLA DE AUDITORÍA INMUTABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  details JSONB NOT NULL,
  ip TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 5. TABLA DE ALERTAS ADMINISTRATIVAS
CREATE TABLE IF NOT EXISTS admin_alerts (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at BIGINT
);

-- 6. TABLA DE TELEMETRÍA Y EVENTOS ANALÍTICOS
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tool_slug TEXT,
  category TEXT,
  duration_ms INTEGER,
  status TEXT,
  error_type TEXT,
  path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  timestamp BIGINT NOT NULL
);

-- 7. TABLA DE ERRORES DEL SISTEMA
CREATE TABLE IF NOT EXISTS system_errors (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  tool TEXT,
  error_type TEXT NOT NULL,
  technical_message TEXT NOT NULL,
  endpoint TEXT,
  browser TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  frequency INTEGER NOT NULL DEFAULT 1,
  last_seen_at BIGINT NOT NULL
);

-- 8. TABLA DE CONFIGURACIÓN GLOBAL DEL SISTEMA
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  ads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  global_banner_text TEXT NOT NULL DEFAULT 'Nueva actualización: 20 herramientas disponibles 100% privadas.',
  banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 120,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_minutes INTEGER NOT NULL DEFAULT 15,
  updated_at BIGINT NOT NULL
);

-- 9. TABLA DE FEEDBACK Y REPORTES DE USUARIOS
CREATE TABLE IF NOT EXISTS feedback_and_reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  tool_slug TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL
);

-- 10. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_system_errors_timestamp ON system_errors(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_timestamp ON admin_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

-- 11. REGISTRO INICIAL DE CONFIGURACIÓN
INSERT INTO system_settings (
  id,
  ads_enabled,
  maintenance_mode,
  global_banner_text,
  banner_enabled,
  session_timeout_minutes,
  max_login_attempts,
  lockout_minutes,
  updated_at
)
VALUES (
  'singleton',
  true,
  false,
  'Nueva actualización: 20 herramientas disponibles 100% privadas.',
  false,
  120,
  5,
  15,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
)
ON CONFLICT (id) DO NOTHING;
