import { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { newDb } from 'pg-mem';
import * as schema from './schema';

export interface DbInstance {
  pool: any;
  drizzleDb: ReturnType<typeof drizzle<typeof schema>>;
  isInMemory: boolean;
}

let dbInstance: DbInstance | null = null;

export const DDL_STATEMENTS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB,
  totp_secret TEXT,
  totp_enabled BOOLEAN,
  recovery_codes JSONB,
  status TEXT,
  created_at BIGINT NOT NULL,
  last_login_at BIGINT,
  failed_login_attempts INTEGER,
  locked_until BIGINT
);

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
  is_valid BOOLEAN NOT NULL
);

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

CREATE TABLE IF NOT EXISTS admin_alerts (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL,
  resolved_at BIGINT
);

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

CREATE TABLE IF NOT EXISTS system_errors (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  tool TEXT,
  error_type TEXT NOT NULL,
  technical_message TEXT NOT NULL,
  endpoint TEXT,
  browser TEXT,
  status TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  last_seen_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  ads_enabled BOOLEAN NOT NULL,
  maintenance_mode BOOLEAN NOT NULL,
  global_banner_text TEXT NOT NULL,
  banner_enabled BOOLEAN NOT NULL,
  session_timeout_minutes INTEGER NOT NULL,
  max_login_attempts INTEGER NOT NULL,
  lockout_minutes INTEGER NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback_and_reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  tool_slug TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
`;

export function getDb(): DbInstance {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (databaseUrl && databaseUrl.trim().length > 0) {
    console.log('[POSTGRES] Initializing PostgreSQL connection with DATABASE_URL...');
    const pool = new PgPool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
      max: process.env.VERCEL ? 5 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    const drizzleDb = drizzle(pool, { schema });
    dbInstance = {
      pool,
      drizzleDb,
      isInMemory: false
    };
    return dbInstance;
  }

  // Fallback to in-memory PostgreSQL engine for local development and offline testing
  console.log('[POSTGRES] No DATABASE_URL specified. Initializing in-memory PostgreSQL engine (pg-mem)...');
  const memDb = newDb();
  const pgAdapter = memDb.adapters.createPg();
  const pool = new pgAdapter.Pool();
  const drizzleDb = drizzle(pool, { schema });

  dbInstance = {
    pool,
    drizzleDb,
    isInMemory: true
  };

  return dbInstance;
}

let schemaPromise: Promise<void> | null = null;

export async function initializeDatabaseSchema(pool: any): Promise<void> {
  if (schemaPromise) {
    return schemaPromise;
  }

  schemaPromise = (async () => {
    try {
      await pool.query('SELECT 1 FROM users LIMIT 1');
      return;
    } catch {
      // Table does not exist yet; continue to run DDL
    }

    try {
      await pool.query(DDL_STATEMENTS);
      console.log('[POSTGRES] Schema tables verified and initialized successfully.');
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate table'))) {
        return;
      }
      console.error('[POSTGRES] Error executing DDL schema statements:', err);
      throw err;
    }
  })();

  return schemaPromise;
}
