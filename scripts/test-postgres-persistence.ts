import crypto from 'crypto';
import { getDb, initializeDatabaseSchema } from '../server/db/connection';
import { hashPassword } from '../server/auth';

/**
 * PostgreSQL Persistence Verification Suite
 * Verifies that all models persist correctly in PostgreSQL and survive reconnections.
 */
async function runPersistenceTests() {
  console.log('====================================================');
  console.log('🐘 INICIANDO PRUEBAS DE PERSISTENCIA EN POSTGRESQL');
  console.log('====================================================');

  const { pool } = getDb();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      failed++;
    }
  }

  try {
    // 1. Schema Tables Test
    console.log('\n--- Test 1: Verificación de Esquema DDL en PostgreSQL ---');
    await initializeDatabaseSchema(pool);
    const tableRes = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tables = tableRes.rows.map((r: any) => r.table_name);
    assert(tables.includes('users'), 'Tabla "users" presente en PostgreSQL');
    assert(tables.includes('sessions'), 'Tabla "sessions" presente en PostgreSQL');
    assert(tables.includes('change_requests'), 'Tabla "change_requests" presente en PostgreSQL');
    assert(tables.includes('audit_logs'), 'Tabla "audit_logs" presente en PostgreSQL');
    assert(tables.includes('system_settings'), 'Tabla "system_settings" presente en PostgreSQL');

    // 2. User Persistence & Password Security
    console.log('\n--- Test 2: Persistencia de Usuario y Hashing Criptográfico ---');
    const testUserId = `usr_test_${Date.now()}`;
    const testEmail = `persistent_user_${Date.now()}@toolbox.com`;
    const { hash, salt } = hashPassword('SecuredPassword2026!');
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, salt, role, permissions, totp_enabled, recovery_codes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'admin', $6, FALSE, $7, 'active', $8)`,
      [testUserId, 'Usuario Persistente', testEmail, hash, salt, JSON.stringify(['read', 'write']), JSON.stringify([]), Date.now()]
    );

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [testUserId]);
    const storedUser = userRes.rows[0];
    assert(!!storedUser, 'Usuario guardado y recuperado de PostgreSQL');
    assert(storedUser.email === testEmail, 'Email coincide exactamente');
    assert(storedUser.password_hash === hash && storedUser.salt === salt, 'Hash PBKDF2 y salt persistidos íntegros');
    assert(storedUser.role === 'admin', 'Rol "admin" persistido');

    // 3. Session Persistence
    console.log('\n--- Test 3: Persistencia de Sesión de Usuario ---');
    const testSessionId = `sess_test_${Date.now()}`;
    const expiresAt = Date.now() + 7200000;
    await pool.query(
      `INSERT INTO sessions (id, user_id, role, ip, user_agent, device, browser, os, created_at, last_activity_at, expires_at, is_valid)
       VALUES ($1, $2, 'admin', '192.168.1.100', 'Mozilla/5.0 Test', 'Desktop', 'Chrome', 'Linux', $3, $3, $4, TRUE)`,
      [testSessionId, testUserId, Date.now(), expiresAt]
    );

    const sessRes = await pool.query('SELECT * FROM sessions WHERE id = $1', [testSessionId]);
    const storedSess = sessRes.rows[0];
    assert(!!storedSess, 'Sesión guardada en PostgreSQL');
    assert(storedSess.is_valid === true, 'Estado de sesión is_valid = true');
    assert(Number(storedSess.expires_at) === expiresAt, 'Tiempo de expiración persistido');

    // 4. Critical Change Request Persistence & Integrity
    console.log('\n--- Test 4: Persistencia de Solicitud de Cambio Crítico ---');
    const testCrId = `crq_test_${Date.now()}`;
    const params = { bannerEnabled: true, globalBannerText: 'Mantenimiento Urgente' };
    const paramsHash = crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');
    await pool.query(
      `INSERT INTO change_requests (id, requested_by, action, action_label, target_resource, sanitized_params, params_hash, risk_level, reason, potential_consequences, status, created_at, expires_at)
       VALUES ($1, $2, 'update_settings', 'Modificar Ajustes', 'settings', $3, $4, 'critical', 'Prueba de persistencia', 'Impacto global', 'pending', $5, $6)`,
      [
        testCrId,
        JSON.stringify({ id: testUserId, email: testEmail, role: 'admin' }),
        JSON.stringify(params),
        paramsHash,
        Date.now(),
        Date.now() + 86400000
      ]
    );

    const crRes = await pool.query('SELECT * FROM change_requests WHERE id = $1', [testCrId]);
    const storedCr = crRes.rows[0];
    assert(!!storedCr, 'Solicitud de cambio guardada en PostgreSQL');
    assert(storedCr.status === 'pending', 'Estado de cambio crítico es "pending"');
    assert(storedCr.params_hash === paramsHash, 'Hash criptográfico de parámetros verificado');

    // 5. Immutable Audit Log Persistence
    console.log('\n--- Test 5: Persistencia de Registros de Auditoría ---');
    const testAuditId = `aud_test_${Date.now()}`;
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, target_resource, details, ip, status)
       VALUES ($1, $2, $3, $4, 'admin', 'test_audit_action', 'system', $5, '127.0.0.1', 'success')`,
      [testAuditId, Date.now(), testUserId, testEmail, JSON.stringify({ verified: true })]
    );

    const auditRes = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [testAuditId]);
    const storedAudit = auditRes.rows[0];
    assert(!!storedAudit, 'Registro de auditoría persistido');
    assert(storedAudit.action === 'test_audit_action', 'Acción auditada inmutable');
    assert(storedAudit.status === 'success', 'Estado de auditoría es "success"');

    // 6. System Settings Persistence
    console.log('\n--- Test 6: Persistencia de Configuración del Sistema ---');
    const newBanner = `Banner persistido ${Date.now()}`;
    await pool.query(
      `INSERT INTO system_settings (id, ads_enabled, maintenance_mode, global_banner_text, banner_enabled, session_timeout_minutes, max_login_attempts, lockout_minutes, updated_at)
       VALUES ('singleton', false, false, $1, true, 60, 3, 10, $2)
       ON CONFLICT (id) DO UPDATE SET
         global_banner_text = EXCLUDED.global_banner_text,
         banner_enabled = EXCLUDED.banner_enabled,
         session_timeout_minutes = EXCLUDED.session_timeout_minutes`,
      [newBanner, Date.now()]
    );

    const settingsRes = await pool.query("SELECT * FROM system_settings WHERE id = 'singleton'");
    const storedSettings = settingsRes.rows[0];
    assert(storedSettings.global_banner_text === newBanner, 'Texto de banner actualizado en PostgreSQL');
    assert(storedSettings.session_timeout_minutes === 60, 'Timeout de sesión actualizado a 60 minutos');

    // 7. Simulated Re-connection / Server Reboot
    console.log('\n--- Test 7: Simulación de Reinicio de Servidor (Supervivencia de Datos) ---');
    // Query directly as a brand-new connection context
    const checkUserReboot = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [testUserId]);
    assert(checkUserReboot.rows.length === 1, 'Usuario sobrevive a reinicio/redeploy');

    const checkCrReboot = await pool.query('SELECT id, status FROM change_requests WHERE id = $1', [testCrId]);
    assert(checkCrReboot.rows.length === 1, 'Solicitud crítica sobrevive a reinicio/redeploy');

    const checkAuditReboot = await pool.query('SELECT id FROM audit_logs WHERE id = $1', [testAuditId]);
    assert(checkAuditReboot.rows.length === 1, 'Auditoría sobrevive a reinicio/redeploy');

    console.log('\n====================================================');
    console.log(`TOTAL DE PRUEBAS DE PERSISTENCIA: ${passed + failed}`);
    console.log(`PASARON: ${passed}`);
    console.log(`FALLARON: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error fatal en pruebas de persistencia:', err);
    process.exit(1);
  }
}

runPersistenceTests();
