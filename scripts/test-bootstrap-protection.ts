import { getDb, initializeDatabaseSchema } from '../server/db/connection';
import { db } from '../server/db';
import { hashPassword, verifyPassword } from '../server/auth';
import { createApp } from '../server/app';
import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`✅ [PASS] ${name}: ${details}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`❌ [FAIL] ${name}: ${details}`);
  }
}

async function requestJson(
  port: number,
  path: string,
  method: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode || 500, data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode || 500, data: raw, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runBootstrapTests() {
  console.log('====================================================');
  console.log('🛡️ INICIANDO SUITE DE PRUEBAS DE BOOTSTRAP ÚNICO');
  console.log('====================================================\n');

  // Start test server on dynamic port (e.g. 3333)
  const app = createApp();
  const testPort = 3333;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(testPort, '127.0.0.1', () => {
      resolve();
    });
  });

  const { pool } = getDb();
  await initializeDatabaseSchema(pool);
  await db.ensureReady();

  try {
    // Preserve existing users to restore after test completes
    const originalUsers = await pool.query('SELECT * FROM users');
    const originalAudit = await pool.query('SELECT * FROM audit_logs');

    // Clean users for isolated test sequence
    await pool.query('DELETE FROM users');
    await db.syncFromPostgres();

    // ------------------------------------------------------------------------
    // TEST 1: bootstrap-status returns needsBootstrap: true when 0 super_admin
    // ------------------------------------------------------------------------
    console.log('\n--- Test 1: Comprobación de estado con 0 super_admin ---');
    const statusRes1 = await requestJson(testPort, '/api/auth/bootstrap-status', 'GET');
    assert(
      statusRes1.status === 200 && statusRes1.data?.needsBootstrap === true,
      'Status inicial con 0 super_admin',
      `needsBootstrap: ${statusRes1.data?.needsBootstrap}, Status code: ${statusRes1.status}`
    );

    // ------------------------------------------------------------------------
    // TEST 2: Validación de entradas (contraseña débil / campos vacíos)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Validación de datos de entrada ---');
    const weakPassRes = await requestJson(testPort, '/api/auth/bootstrap-first-superadmin', 'POST', {
      name: 'Super Admin Test',
      email: 'superadmin@test.com',
      password: '123' // too short
    });
    assert(
      weakPassRes.status === 400 && weakPassRes.data?.error === 'WeakPassword',
      'Rechazo de contraseña corta (<8)',
      `Status: ${weakPassRes.status}, Error: ${weakPassRes.data?.error}`
    );

    const invalidEmailRes = await requestJson(testPort, '/api/auth/bootstrap-first-superadmin', 'POST', {
      name: 'Super Admin Test',
      email: 'not-an-email',
      password: 'ValidPassword123!'
    });
    assert(
      invalidEmailRes.status === 400 && invalidEmailRes.data?.error === 'InvalidEmail',
      'Rechazo de email inválido',
      `Status: ${invalidEmailRes.status}, Error: ${invalidEmailRes.data?.error}`
    );

    // ------------------------------------------------------------------------
    // TEST 3: No se puede seleccionar rol desde el cliente
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: No se puede seleccionar rol desde el cliente ---');
    // The endpoint forces role to 'super_admin' regardless of what client sends
    // ------------------------------------------------------------------------
    // TEST 4: Creación de exactamente 1 super_admin exitoso (0 -> 1)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Creación exitosa del primer super_admin (0 -> 1) ---');
    const testSuperEmail = 'primary_superadmin@testdomain.com';
    const testSuperPass = 'MasterSuperSecure2026!';
    const createRes = await requestJson(testPort, '/api/auth/bootstrap-first-superadmin', 'POST', {
      name: 'Fundador Sistema',
      email: testSuperEmail,
      password: testSuperPass,
      role: 'arbitrary_role_injection_attempt' // Injected role must be ignored
    });

    assert(
      createRes.status === 201 && createRes.data?.success === true,
      'Creación exitosa del primer super_admin (HTTP 201)',
      `Status: ${createRes.status}, Message: ${createRes.data?.message}`
    );

    // Verify in database
    const dbUserRes = await pool.query('SELECT * FROM users WHERE email = $1', [testSuperEmail]);
    const createdSuper = dbUserRes.rows[0];
    assert(!!createdSuper, 'Super admin persistido en PostgreSQL', `ID: ${createdSuper?.id}`);
    assert(
      createdSuper?.role === 'super_admin',
      'Rol forzado estrictamente como "super_admin"',
      `Role en DB: ${createdSuper?.role}`
    );
    assert(
      createdSuper?.totp_enabled === false,
      'TOTP inicial en false (obliga a configurar 2FA en primer login)',
      `totp_enabled: ${createdSuper?.totp_enabled}`
    );

    // Verify password hash uses canonical PBKDF2
    const verifyValid = verifyPassword(testSuperPass, createdSuper.password_hash, createdSuper.salt);
    const verifyInvalid = verifyPassword('WrongPassword', createdSuper.password_hash, createdSuper.salt);
    assert(
      verifyValid === true && verifyInvalid === false,
      'Contraseña cifrada con algoritmo canónico PBKDF2 de server/auth.ts',
      `Valid: ${verifyValid}, Invalid: ${verifyInvalid}`
    );

    // Verify audit log exists and contains NO secrets
    const auditRes = await pool.query(
      "SELECT * FROM audit_logs WHERE action = 'bootstrap_initial_super_admin'"
    );
    const log = auditRes.rows[0];
    assert(
      !!log,
      'Registro de audit_log generado para el bootstrap',
      `Action: ${log?.action}, Target: ${log?.target_resource}`
    );
    const logDetailsStr = JSON.stringify(log?.details || '');
    assert(
      !logDetailsStr.includes(testSuperPass) &&
      !logDetailsStr.includes('password') &&
      !logDetailsStr.includes('salt') &&
      !logDetailsStr.includes('hash'),
      'Audit log NO contiene contraseñas, hashes ni secretos',
      `Audit details: ${logDetailsStr}`
    );

    // Verify NO session token or auto-login in response
    assert(
      !createRes.data?.token && !createRes.data?.session,
      'Sin inicio de sesión automático en respuesta del bootstrap',
      'Respuesta no incluye token de sesión'
    );

    // ------------------------------------------------------------------------
    // TEST 5: bootstrap-status returns needsBootstrap: false después de creado 1
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Comprobación de estado después de creado 1 ---');
    const statusRes2 = await requestJson(testPort, '/api/auth/bootstrap-status', 'GET');
    assert(
      statusRes2.status === 200 && statusRes2.data?.needsBootstrap === false,
      'Status después de creado: needsBootstrap = false',
      `needsBootstrap: ${statusRes2.data?.needsBootstrap}`
    );

    // ------------------------------------------------------------------------
    // TEST 6: Segundo intento de bootstrap devuelve 403 permanentemente bloqueado
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Segundo intento devuelve 403 Forbidden ---');
    const secondAttemptRes = await requestJson(testPort, '/api/auth/bootstrap-first-superadmin', 'POST', {
      name: 'Intruso Segundo Super Admin',
      email: 'attacker@evil.com',
      password: 'AttackerPassword2026!'
    });
    assert(
      secondAttemptRes.status === 403 && secondAttemptRes.data?.error === 'BootstrapLocked',
      'Segundo intento bloqueado con 403 BootstrapLocked',
      `Status: ${secondAttemptRes.status}, Error: ${secondAttemptRes.data?.error}`
    );

    // Verify count of super_admin in DB is still EXACTLY 1
    const countAfterSecond = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'");
    assert(
      parseInt(countAfterSecond.rows[0]?.count || '0', 10) === 1,
      'COUNT(super_admin) permanece estrictamente en 1',
      `Count: ${countAfterSecond.rows[0]?.count}`
    );

    // ------------------------------------------------------------------------
    // TEST 7: Dos solicitudes simultáneas (Race condition / Concurrency test)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Prueba de concurrencia y solicitudes simultáneas ---');
    // Temporarily remove super_admin to test simultaneous race condition
    await pool.query("DELETE FROM users WHERE role = 'super_admin'");
    await db.syncFromPostgres();

    // Test simultaneous requests from two different client IPs
    const [reqA, reqB] = await Promise.all([
      requestJson(
        testPort,
        '/api/auth/bootstrap-first-superadmin',
        'POST',
        {
          name: 'Concurrent Admin A',
          email: 'admin_a@concurrent.test',
          password: 'PasswordA12345!'
        },
        { 'x-forwarded-for': '203.0.113.195' }
      ),
      requestJson(
        testPort,
        '/api/auth/bootstrap-first-superadmin',
        'POST',
        {
          name: 'Concurrent Admin B',
          email: 'admin_b@concurrent.test',
          password: 'PasswordB12345!'
        },
        { 'x-forwarded-for': '198.51.100.42' }
      )
    ]);

    const statuses = [reqA.status, reqB.status].sort();
    const successCount = statuses.filter(s => s === 201).length;
    const blockedCount = statuses.filter(s => s === 403 || s === 409 || s === 429).length;

    assert(
      successCount === 1 && blockedCount === 1,
      'Solamente UNA de las solicitudes simultáneas tuvo éxito (la otra fue bloqueada)',
      `Status A: ${reqA.status} (${reqA.data?.error || 'success'}), Status B: ${reqB.status} (${reqB.data?.error || 'success'})`
    );

    const countAfterConcurrent = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'");
    assert(
      parseInt(countAfterConcurrent.rows[0]?.count || '0', 10) === 1,
      'Imposible crear dos super_admin bajo concurrencia',
      `Super admin count: ${countAfterConcurrent.rows[0]?.count}`
    );

    // ------------------------------------------------------------------------
    // TEST 8: Login posterior detecta super_admin y exige configuración TOTP
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Login posterior detecta super_admin y exige TOTP ---');
    // Get the email of the super admin that won the race
    const winningUserRes = await pool.query("SELECT email FROM users WHERE role = 'super_admin' LIMIT 1");
    const winningEmail = winningUserRes.rows[0].email;
    const winningPass = winningEmail.includes('admin_a') ? 'PasswordA12345!' : 'PasswordB12345!';

    const loginRes = await requestJson(testPort, '/api/auth/login', 'POST', {
      email: winningEmail,
      password: winningPass
    });

    assert(
      loginRes.status === 200 &&
      loginRes.data?.requires2FA === true &&
      loginRes.data?.setup2FA === true &&
      !!loginRes.data?.tempToken &&
      !!loginRes.data?.qrCodeDataUrl,
      'Login detecta super_admin y exige configuración obligatoria de TOTP 2FA',
      `requires2FA: ${loginRes.data?.requires2FA}, setup2FA: ${loginRes.data?.setup2FA}, hasQrCode: ${!!loginRes.data?.qrCodeDataUrl}`
    );

    // ------------------------------------------------------------------------
    // CLEANUP & RESTORE ORIGINAL DATABASE STATE
    // ------------------------------------------------------------------------
    console.log('\n--- Restaurando estado original de la base de datos ---');
    await pool.query('DELETE FROM users');
    for (const u of originalUsers.rows) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, salt, role, permissions, totp_secret, totp_enabled, recovery_codes, status, created_at, last_login_at, failed_login_attempts, locked_until, reset_password_token_hash, reset_password_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO NOTHING`,
        [
          u.id, u.name, u.email, u.password_hash, u.salt, u.role,
          typeof u.permissions === 'string' ? u.permissions : JSON.stringify(u.permissions || []),
          u.totp_secret, u.totp_enabled,
          typeof u.recovery_codes === 'string' ? u.recovery_codes : JSON.stringify(u.recovery_codes || []),
          u.status, u.created_at, u.last_login_at, u.failed_login_attempts, u.locked_until,
          u.reset_password_token_hash, u.reset_password_expires_at
        ]
      );
    }

    console.log('✅ Estado original restaurado con éxito.');
  } finally {
    server.close();
  }

  // Summary
  console.log('\n====================================================');
  console.log('📊 RESUMEN DE PRUEBAS DE BOOTSTRAP:');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Pasadas: ${passedCount} | Fallidas: ${failedCount}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runBootstrapTests().catch((err) => {
  console.error('Error fatal durante pruebas de bootstrap:', err);
  process.exit(1);
});
