ts
import { hashPassword } from './server/auth';
import crypto from 'crypto';
import { Client } from 'pg';
import readline from 'readline';

const EMAIL = 'yocarortiz05@hotmail.com';
const NAME = 'Yocar ortiz';

function askPassword(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    process.stdout.write('Escribe la contraseña del Super Admin: ');

    let password = 'Yoscar05271117*';

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);

      process.stdin.on('data', (chunk) => {
        const char = chunk.toString();

        if (char === '\n' || char === '\r') {
          process.stdin.setRawMode(false);
          process.stdin.removeAllListeners('data');
          rl.close();
          process.stdout.write('\n');
          resolve(password);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007f') {
          password = password.slice(0, -1);
        } else {
          password += char;
        }
      });
    } else {
      rl.question('', (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Falta DATABASE_URL. Configúrala apuntando a tu base de datos Neon.'
    );
  }

  const password = await askPassword();

  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  // Usa EXACTAMENTE el mismo sistema de hash de server/auth.ts
  const { hash, salt } = hashPassword(password);

  // La contraseña original deja de utilizarse después de generar el hash.
  // No se imprime ni se almacena.
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id, role
       FROM public.users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [EMAIL]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');

      console.log(
        `Ya existe un usuario con el correo ${EMAIL}. No se modificó nada.`
      );

      process.exit(0);
    }

    const id = `usr_${crypto.randomBytes(16).toString('hex')}`;
    const now = Date.now();

    await client.query(
      `INSERT INTO public.users (
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
        $1,
        $2,
        $3,
        $4,
        $5,
        'super_admin',
        '[]'::jsonb,
        NULL,
        false,
        '[]'::jsonb,
        'active',
        $6,
        NULL,
        0,
        NULL,
        NULL,
        NULL
      )`,
      [
        id,
        NAME,
        EMAIL,
        hash,
        salt,
        now
      ]
    );

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('SUPER ADMIN CREADO CORRECTAMENTE');
    console.log('========================================');
    console.log(`Nombre: ${NAME}`);
    console.log(`Email: ${EMAIL}`);
    console.log('Rol: super_admin');
    console.log('TOTP: pendiente de configuración');
    console.log('Estado: active');
    console.log('========================================\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('\nERROR:', error.message);
  process.exit(1);
});
```
