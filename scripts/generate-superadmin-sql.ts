import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { hashPassword, HASH_ITERATIONS, KEY_LENGTH, DIGEST } from '../server/auth';

const TARGET_EMAIL = 'yocarortiz05@hotmail.com';
const TARGET_NAME = 'Yocar ortiz';

function getPassword(): Promise<string> {
  // 1. Check direct environment variable
  if (process.env.SUPER_ADMIN_PASSWORD && process.env.SUPER_ADMIN_PASSWORD.trim().length >= 8) {
    return Promise.resolve(process.env.SUPER_ADMIN_PASSWORD.trim());
  }

  // 2. Check CLI argument
  const argPass = process.argv[2];
  if (argPass && argPass.trim().length >= 8) {
    return Promise.resolve(argPass.trim());
  }

  // 3. Check .env or .env.example fallback
  for (const envFile of ['.env', '.env.example']) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/SUPER_ADMIN_PASSWORD=([^\r\n]+)/);
      if (match && match[1].trim() && match[1].trim().length >= 8) {
        return Promise.resolve(match[1].trim());
      }
    }
  }

  // 4. Interactive prompt
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Introduce la contraseña para el Super Admin: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const password = await getPassword();

  if (!password || password.length < 8) {
    console.error('❌ Error: La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  // Genera hash y salt usando exactamente la misma función de server/auth.ts (PBKDF2)
  const { hash, salt } = hashPassword(password);
  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();

  const sql = `-- ====================================================================
-- SCRIPT SQL GENERADO PARA NEON POSTGRESQL (SUPER ADMIN: Yocar ortiz)
-- Algoritmo: PBKDF2 (${HASH_ITERATIONS.toLocaleString()} iteraciones, digest: ${DIGEST}, longitud: ${KEY_LENGTH} bytes)
-- Tabla destino: public.users
-- ====================================================================

-- 1. Asegurar que la estructura de la tabla users existe
CREATE TABLE IF NOT EXISTS public.users (
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

-- 2. Inserción segura con ON CONFLICT (evita duplicados y actualiza si ya existía)
INSERT INTO public.users (
  id,
  name,
  email,
  password_hash,
  salt,
  role,
  permissions,
  totp_secret,
  totp_enabled,
  recovery_codes,
  status,
  created_at,
  last_login_at,
  failed_login_attempts,
  locked_until,
  reset_password_token_hash,
  reset_password_expires_at
)
VALUES (
  '${userId}',
  '${TARGET_NAME}',
  '${TARGET_EMAIL}',
  '${hash}',
  '${salt}',
  'super_admin',
  '["*"]'::jsonb,
  NULL,
  false,
  '[]'::jsonb,
  'active',
  ${now},
  NULL,
  0,
  NULL,
  NULL,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  role = 'super_admin',
  permissions = EXCLUDED.permissions,
  totp_enabled = false,
  totp_secret = NULL,
  status = 'active',
  failed_login_attempts = 0,
  locked_until = NULL;

-- 3. Consulta de verificación segura (no expone hash, salt ni tokens)
SELECT id, name, email, role, status, totp_enabled, created_at
FROM public.users
WHERE LOWER(email) = LOWER('${TARGET_EMAIL}');
`;

  // Verificación de compatibilidad con server/auth.ts
  const verified = crypto.timingSafeEqual(
    Buffer.from(crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')),
    Buffer.from(hash)
  );

  if (!verified) {
    console.error('❌ Error fatal: La verificación del hash PBKDF2 falló.');
    process.exit(1);
  }

  console.log(sql);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
