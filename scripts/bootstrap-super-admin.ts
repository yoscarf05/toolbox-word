import crypto from 'crypto';
import { getDb, initializeDatabaseSchema } from '../server/db/connection';
import { hashPassword } from '../server/auth';

/**
 * Bootstrap Script for Initial Super Admin Creation (PostgreSQL / Neon Production)
 *
 * Requirements:
 * - Connects to PostgreSQL (using DATABASE_URL from environment)
 * - Checks if a super_admin already exists in the database
 * - Prevents accidental creation of a second super_admin
 * - Provisions the first super_admin ONLY if none exists
 * - Uses PBKDF2 (100,000 iterations) with unique cryptographic salt
 * - Sets totpEnabled = false initially (mandating 2FA setup on first login)
 * - Never prints secrets or plaintext passwords to console
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." SUPER_ADMIN_EMAIL="admin@domain.com" SUPER_ADMIN_PASSWORD="StrongPassword" npm run bootstrap:superadmin
 */
async function bootstrap() {
  console.log('====================================================');
  console.log('🛡️  TOOLBOX WORD - BOOTSTRAP DE SUPER ADMINISTRADOR (POSTGRESQL)');
  console.log('====================================================');

  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const arg = args.find((a) => a.startsWith(prefix));
    if (arg) return arg.slice(prefix.length).trim();
    const idx = args.indexOf(`--${name}`);
    if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
      return args[idx + 1].trim();
    }
    return undefined;
  };

  const email = (process.env.SUPER_ADMIN_EMAIL || getArg('email') || '').trim().toLowerCase();
  const password = (process.env.SUPER_ADMIN_PASSWORD || getArg('password') || '').trim();
  const name = (process.env.SUPER_ADMIN_NAME || getArg('name') || 'Super Administrador').trim();

  if (!email || !email.includes('@')) {
    console.error('❌ Error: Debes especificar un correo electrónico válido.');
    console.error('Uso: SUPER_ADMIN_EMAIL="..." SUPER_ADMIN_PASSWORD="..." npm run bootstrap:superadmin');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Error: La contraseña debe tener al menos 8 caracteres de longitud.');
    process.exit(1);
  }

  const { pool } = getDb();

  try {
    // 1. Ensure tables exist in PostgreSQL
    await initializeDatabaseSchema(pool);

    // 2. Check if a Super Admin ALREADY exists in PostgreSQL
    const checkRes = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'super_admin' LIMIT 1"
    );

    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      console.error(`❌ Operación bloqueada: Ya existe un Super Administrador en la base de datos (${existing.email}).`);
      console.error('   Por motivos de seguridad, no se permite crear un segundo Super Administrador ni sobreescribir la cuenta existente vía bootstrap.');
      process.exit(1);
    }

    // 3. Check if user with that email already exists with another role
    const emailCheckRes = await pool.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    const { hash, salt } = hashPassword(password);
    const now = Date.now();

    if (emailCheckRes.rows.length > 0) {
      // User exists with regular role -> elevate to first super_admin
      const userId = emailCheckRes.rows[0].id;
      await pool.query(
        `UPDATE users SET
           name = $1,
           password_hash = $2,
           salt = $3,
           role = 'super_admin',
           permissions = $4,
           totp_enabled = FALSE,
           totp_secret = NULL,
           recovery_codes = '[]'::jsonb,
           status = 'active',
           failed_login_attempts = 0,
           locked_until = NULL
         WHERE id = $5`,
        [name, hash, salt, JSON.stringify(['*']), userId]
      );
      console.log(`✅ Usuario existente '${email}' promovido como PRIMER Super Administrador en PostgreSQL.`);
    } else {
      // Create new Super Admin record
      const userId = `usr_${now}_${crypto.randomBytes(4).toString('hex')}`;
      await pool.query(
        `INSERT INTO users (
           id, name, email, password_hash, salt, role, permissions,
           totp_secret, totp_enabled, recovery_codes, status, created_at, failed_login_attempts
         ) VALUES ($1, $2, $3, $4, $5, 'super_admin', $6, NULL, FALSE, '[]'::jsonb, 'active', $7, 0)`,
        [userId, name, email, hash, salt, JSON.stringify(['*']), now]
      );
      console.log(`✅ Primer Super Administrador creado exitosamente en PostgreSQL (${email}).`);
    }

    // 4. Record initial bootstrap event in audit log
    const auditId = `aud_${now}_${crypto.randomBytes(4).toString('hex')}`;
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, target_resource, details, ip, status)
       VALUES ($1, $2, 'bootstrap_cli', $3, 'super_admin', 'bootstrap_super_admin', 'users', $4, '127.0.0.1', 'success')`,
      [auditId, now, email, JSON.stringify({ message: 'First Super Admin provisioned via secure bootstrap CLI' })]
    );

    console.log('👉 Siguiente paso: Inicia sesión en la interfaz web de la aplicación para configurar Google Authenticator (TOTP) y guardar tus códigos de recuperación.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando bootstrap en PostgreSQL:', err);
    process.exit(1);
  }
}

bootstrap();
