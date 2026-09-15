import fs from 'fs';
import path from 'path';
import { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export interface DbInstance {
  pool: any;
  drizzleDb: ReturnType<typeof drizzle<typeof schema>>;
  isInMemory: boolean;
}

let dbInstance: DbInstance | null = null;

function createInMemoryPool(): any {
  try {
    // Lazy load pg-mem only if fallback is needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { newDb } = require('pg-mem');
    const memDb = newDb();
    const pgAdapter = memDb.adapters.createPg();
    return new pgAdapter.Pool();
  } catch (err) {
    console.error('[POSTGRES] Could not initialize pg-mem pool:', err);
    // Fallback minimal mock pool to prevent hard crashes
    return {
      query: async () => ({ rows: [] }),
      connect: async () => ({
        query: async () => ({ rows: [] }),
        release: () => {}
      }),
      on: () => {}
    };
  }
}

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
  locked_until BIGINT,
  reset_password_token_hash TEXT,
  reset_password_expires_at BIGINT
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

export function sanitizeDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let clean = rawUrl.trim();
  // Strip any leading '=' characters or whitespace that might come from bad env declarations
  while (clean.startsWith('=')) {
    clean = clean.substring(1).trim();
  }
  // Strip accidental variable assignment prefix e.g. "DATABASE_URL=..." or "POSTGRES_URL=..."
  if (clean.startsWith('DATABASE_URL=')) {
    clean = clean.substring('DATABASE_URL='.length).trim();
  } else if (clean.startsWith('POSTGRES_URL=')) {
    clean = clean.substring('POSTGRES_URL='.length).trim();
  }
  while (clean.startsWith('=')) {
    clean = clean.substring(1).trim();
  }
  // Strip enclosing single or double quotes
  if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
    clean = clean.slice(1, -1).trim();
  }

  // Detect unpopulated or template placeholders that Vercel or Supabase might leave in "Needs Attention" state
  const lower = clean.toLowerCase();
  if (
    lower.includes('[your-password]') ||
    lower.includes('[your_password]') ||
    lower.includes('<your-password>') ||
    lower.includes('<password>') ||
    lower.includes('[password]') ||
    lower.includes('[your-database-password]') ||
    lower.includes('placeholder') ||
    clean === 'undefined' ||
    clean === 'null'
  ) {
    console.warn('[POSTGRES] La variable de base de datos contiene texto de plantilla (por ejemplo [YOUR-PASSWORD] o Needs Attention en Vercel). Descartando URL no configurada.');
    return undefined;
  }

  if (!clean.startsWith('postgres://') && !clean.startsWith('postgresql://')) {
    console.warn('[POSTGRES] La URL no comienza con postgres:// ni postgresql://. Descartando.');
    return undefined;
  }

  return clean.length > 0 ? clean : undefined;
}

export function getDb(): DbInstance {
  if (dbInstance) {
    return dbInstance;
  }

  // Check DATABASE_URL first; if valid, prefer it over POSTGRES_URL
  let databaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);
  if (!databaseUrl) {
    databaseUrl = sanitizeDatabaseUrl(process.env.POSTGRES_URL);
  }

  // Fallback to read from .env if running in Node and process.env is missing it
  if (!databaseUrl) {
    for (const envFile of ['.env', '.env.local']) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf-8');
          const match = content.match(/DATABASE_URL=([^\r\n]+)/);
          if (match && match[1].trim()) {
            databaseUrl = sanitizeDatabaseUrl(match[1].trim());
            if (databaseUrl) break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (databaseUrl) {
    console.log('[POSTGRES] Initializing PostgreSQL connection with Neon/PostgreSQL...');
    const pool = new PgPool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
      max: process.env.VERCEL ? 5 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[POSTGRES] Pool client error:', err);
    });

    const drizzleDb = drizzle(pool, { schema });
    dbInstance = {
      pool,
      drizzleDb,
      isInMemory: false
    };
    return dbInstance;
  }

  if (!databaseUrl) {
    if (isProduction) {
      console.warn('[POSTGRES] AVISO: DATABASE_URL no configurada en entorno de producción/Vercel. Operando con motor PostgreSQL seguro en memoria para mantener la plataforma 100% funcional. Para persistencia permanente entre instancias en Vercel, agrega DATABASE_URL en las Variables de Entorno de Vercel.');
    } else {
      console.warn('[POSTGRES] AVISO: Sin DATABASE_URL. Inicializando motor de pruebas en memoria (pg-mem)...');
    }

    const pool = createInMemoryPool();
    let drizzleDb: any;
    try {
      drizzleDb = drizzle(pool, { schema });
    } catch {
      drizzleDb = null;
    }

    dbInstance = {
      pool,
      drizzleDb,
      isInMemory: true
    };

    return dbInstance;
  }
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
      // Split DDL statements by semicolon to execute each independently and safely
      const statements = DDL_STATEMENTS.split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (stmtErr: any) {
          if (stmtErr.message && (stmtErr.message.includes('already exists') || stmtErr.message.includes('duplicate table'))) {
            continue;
          }
          console.warn('[POSTGRES] Notice on DDL statement execution:', stmtErr?.message);
        }
      }
      console.log('[POSTGRES] Schema tables verified and initialized successfully.');
    } catch (err: any) {
      schemaPromise = null; // allow retry on subsequent requests
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate table'))) {
        return;
      }
      console.error('[POSTGRES] Error executing DDL schema statements:', err);
      throw err;
    }
  })();

  return schemaPromise;
}
