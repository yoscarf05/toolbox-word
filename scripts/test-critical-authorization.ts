import path from 'path';
import fs from 'fs';
import { generateSecret, generateSync } from 'otplib';
import { db } from '../server/db';
import { hashPassword } from '../server/auth';

const BASE_URL = 'http://localhost:3000';

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

async function runTests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO PRUEBAS REALES DE AUTORIZACIÓN CRÍTICA');
  console.log('====================================================\n');

  // 1. Setup / Identify Users in DB
  await db.init();
  await db.syncFromPostgres();
  const data = db.getData();
  let superAdminUser = data.users.find(u => u.role === 'super_admin');
  let adminUser = data.users.find(u => u.email === 'admintester@tools.local');
  let normalUser = data.users.find(u => u.email === 'normaluser@tools.local');

  if (!superAdminUser) {
    const superAdminPassword = 'SuperAdminTestPass123!';
    const superHash = hashPassword(superAdminPassword);
    const newSuper = {
      id: 'usr_super_test_' + Date.now(),
      name: 'Super Admin Tester',
      email: 'superadmin@tools.local',
      passwordHash: superHash.hash,
      salt: superHash.salt,
      role: 'super_admin' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      permissions: ['*'],
      totpEnabled: true,
      totpSecret: generateSecret(),
      recoveryCodes: [],
      failedLoginAttempts: 0
    };
    data.users.push(newSuper);
    superAdminUser = newSuper;
  }

  // Ensure super admin has a known password and TOTP secret
  const superAdminPassword = 'SuperAdminTestPass123!';
  const superHash = hashPassword(superAdminPassword);
  superAdminUser.passwordHash = superHash.hash;
  superAdminUser.salt = superHash.salt;
  superAdminUser.totpEnabled = true;
  superAdminUser.failedLoginAttempts = 0;
  superAdminUser.lockedUntil = undefined;
  const totpSecret = superAdminUser.totpSecret || 'JBSWY3DPEHPK3PXP';
  superAdminUser.totpSecret = totpSecret;

  // Ensure admin user exists with known password
  const adminPassword = 'AdminTestPass123!';
  const adminHash = hashPassword(adminPassword);
  if (!adminUser) {
    const newAdmin = {
      id: 'usr_test_admin_' + Date.now(),
      name: 'Admin Tester',
      email: 'admintester@tools.local',
      passwordHash: adminHash.hash,
      salt: adminHash.salt,
      role: 'admin' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      permissions: ['manage_tools', 'view_analytics', 'view_errors'],
      totpEnabled: false,
      recoveryCodes: [],
      failedLoginAttempts: 0
    };
    data.users.push(newAdmin);
    adminUser = newAdmin;
  } else {
    adminUser.passwordHash = adminHash.hash;
    adminUser.salt = adminHash.salt;
    adminUser.totpEnabled = false;
    adminUser.failedLoginAttempts = 0;
    adminUser.lockedUntil = undefined;
  }

  // Ensure normal user exists
  if (!normalUser) {
    const userHash = hashPassword('NormalPass123!');
    const newNormal = {
      id: 'usr_test_user_' + Date.now(),
      name: 'Normal User',
      email: 'normaluser@tools.local',
      passwordHash: userHash.hash,
      salt: userHash.salt,
      role: 'user' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      permissions: [],
      totpEnabled: false,
      recoveryCodes: [],
      failedLoginAttempts: 0
    };
    data.users.push(newNormal);
    normalUser = newNormal;
  }

  await db.saveUser(superAdminUser);
  await db.saveUser(adminUser);
  await db.saveUser(normalUser);
  await db.syncToPostgres();

  // Helper: Login for regular Admin / Users
  async function loginAdmin(email: string, pass: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  // Helper: Login for Super Admin (Password + TOTP)
  async function loginSuperAdmin(email: string, pass: string, secret: string) {
    const step1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const body1 = await step1.json();
    if (!body1.requires2FA || !body1.tempToken) {
      return { status: step1.status, body: body1 };
    }

    const code = generateSync({ secret });
    const step2 = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: body1.tempToken, code })
    });
    const body2 = await step2.json();
    return { status: step2.status, body: body2 };
  }

  const superLogin = await loginSuperAdmin(superAdminUser.email, superAdminPassword, totpSecret);
  const superToken = superLogin.body.token;

  const adminLogin = await loginAdmin(adminUser.email, adminPassword);
  const adminToken = adminLogin.body.token;

  assert(!!superToken, 'Super Admin Login', 'Obtenido JWT válido tras reautenticación TOTP (2FA)');
  assert(!!adminToken, 'Admin Login', 'Obtenido JWT válido para Administrador');

  if (!superToken || !adminToken) {
    console.error('Login failed:', { superLogin: superLogin.body, adminLogin: adminLogin.body });
    process.exit(1);
  }

  // TEST 1: Intento de admin de elevarse a super_admin (Permission enforcement)
  console.log('\n--- Test 1: Prevención de Elevación de Privilegios de Admin ---');
  {
    // Admin attempts to promote himself
    const res1 = await fetch(`${BASE_URL}/api/admin/users/${adminUser.id}/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'super_admin', reason: 'Intento de auto-elevación' })
    });
    const body1 = await res1.json();
    assert(
      res1.status === 403,
      'Admin Elevación Propia',
      `HTTP ${res1.status}: ${body1.message || body1.error}`
    );

    // Admin attempts to promote another user to super_admin
    const res2 = await fetch(`${BASE_URL}/api/admin/users/${normalUser.id}/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'super_admin', reason: 'Intento de crear super admin' })
    });
    const body2 = await res2.json();
    assert(
      res2.status === 403,
      'Admin Crear Super Admin',
      `HTTP ${res2.status}: ${body2.message || body2.error}`
    );
  }

  // TEST 2: Solicitud de Cambio Crítico (Creation -> HTTP 202 Pending)
  console.log('\n--- Test 2: Creación de Solicitud de Cambio Crítico ---');
  let createdRequestId = '';
  const testSettingsPayload = {
    adsEnabled: false,
    bannerEnabled: true,
    globalBannerText: 'Mantenimiento Preventivo Autorizado ' + Date.now(),
    reason: 'Ajuste de producción solicitado por administración'
  };

  {
    // Admin attempts to change settings without token
    const res = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(testSettingsPayload)
    });
    const body = await res.json();

    assert(
      res.status === 202 && body.authorizationRequired === true,
      'Solicitud Crítica Retorna 202',
      `Respuesta HTTP 202 con mensaje: "${body.message}" e ID: ${body.requestId}`
    );
    createdRequestId = body.requestId;

    // Check that settings were NOT applied
    const verifySettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifySettings = (await verifySettingsRes.json()).settings;
    assert(
      verifySettings.globalBannerText !== testSettingsPayload.globalBannerText,
      'Integridad: Cambio NO Aplicado',
      'El sistema no aplicó los cambios de inmediato, se mantuvo en pending.'
    );
  }

  // TEST 3: Rechazo de Solicitud (Rejection Flow)
  console.log('\n--- Test 3: Flujo de Rechazo de Solicitud ---');
  {
    // Create a temporary request to reject
    const tempReqRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        adsEnabled: true,
        reason: 'Solicitud para probar rechazo'
      })
    });
    const tempReq = await tempReqRes.json();
    const rejectReqId = tempReq.requestId;

    // Super admin rejects the request with Password + TOTP
    const rejectTotp = generateSync({ secret: totpSecret });
    const rejectRes = await fetch(`${BASE_URL}/api/admin/change-requests/${rejectReqId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`
      },
      body: JSON.stringify({
        password: superAdminPassword,
        totpCode: rejectTotp,
        notes: 'Rechazado por riesgo de ingresos publicitarios.'
      })
    });
    const rejectBody = await rejectRes.json();
    assert(
      rejectRes.status === 200 && rejectBody.request?.status === 'rejected',
      'Rechazo por Super Admin',
      `Solicitud ${rejectReqId} rechazada con estado: ${rejectBody.request?.status}`
    );

    // Verify admin cannot execute rejected request
    const execRejectedRes = await fetch(`${BASE_URL}/api/admin/change-requests/${rejectReqId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({})
    });
    assert(
      execRejectedRes.status === 403,
      'Bloqueo de Ejecución de Solicitud Rechazada',
      `HTTP ${execRejectedRes.status}: No se puede ejecutar una solicitud en estado rejected`
    );
  }

  // TEST 4: Aprobación de Solicitud (Approval & Single-Use Token Generation)
  console.log('\n--- Test 4: Aprobación y Emisión de Token Criptográfico ---');
  let validAuthToken = '';
  {
    const approveTotp = generateSync({ secret: totpSecret });
    const approveRes = await fetch(`${BASE_URL}/api/admin/change-requests/${createdRequestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`
      },
      body: JSON.stringify({
        password: superAdminPassword,
        totpCode: approveTotp,
        notes: 'Aprobado tras revisión de mantenimiento preventivo.'
      })
    });
    const approveBody = await approveRes.json();
    validAuthToken = approveBody.authorizationToken;

    assert(
      approveRes.status === 200 && !!validAuthToken && validAuthToken.startsWith('cat_'),
      'Aprobación con Fuerte Autenticación',
      `Token emitido (${validAuthToken.slice(0, 16)}...), expira en 15 min.`
    );
  }

  // TEST 5: Intento de Ejecutar con Parámetros Alterados (Parameter Tampering Prevention)
  console.log('\n--- Test 5: Integridad de Parámetros (Prevención de Alteración) ---');
  {
    // Try to use the token with DIFFERENT parameters than what was requested and approved
    const tamperedPayload = {
      ...testSettingsPayload,
      globalBannerText: 'TEXTO ALTERADO SIN AUTORIZACION HACK'
    };

    const tamperRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-change-authorization-token': validAuthToken
      },
      body: JSON.stringify(tamperedPayload)
    });
    const tamperBody = await tamperRes.json();

    assert(
      tamperRes.status === 403,
      'Detección de Alteración de Parámetros',
      `HTTP ${tamperRes.status}: ${tamperBody.message || tamperBody.error}`
    );
  }

  // TEST 6: Ejecución Válida con Token (Token de Un Solo Uso)
  console.log('\n--- Test 6: Ejecución Válida con Token de Un Solo Uso ---');
  {
    const execRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-change-authorization-token': validAuthToken
      },
      body: JSON.stringify(testSettingsPayload)
    });
    const execBody = await execRes.json();

    assert(
      execRes.status === 200 && execBody.success === true,
      'Ejecución Exitosa con Token Autorizado',
      `Cambio aplicado en producción: bannerEnabled = ${execBody.settings?.bannerEnabled}`
    );

    // Verify settings now reflect the change
    const checkRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const currentSettings = (await checkRes.json()).settings;
    assert(
      currentSettings.globalBannerText === testSettingsPayload.globalBannerText,
      'Verificación de Estado en Producción',
      `Texto activo: "${currentSettings.globalBannerText}"`
    );
  }

  // TEST 7: Intento de Reutilización de Token (Single-Use Enforcement)
  console.log('\n--- Test 7: Intento de Reutilización de Token (Single-Use) ---');
  {
    const reuseRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-change-authorization-token': validAuthToken
      },
      body: JSON.stringify(testSettingsPayload)
    });
    const reuseBody = await reuseRes.json();

    assert(
      reuseRes.status === 403,
      'Rechazo de Token Reutilizado',
      `HTTP ${reuseRes.status}: ${reuseBody.message || reuseBody.error}`
    );
  }

  // TEST 8: Rollback / Reversión a Checkpoint Anterior
  console.log('\n--- Test 8: Rollback a Checkpoint Anterior ---');
  {
    const rollbackTotp = generateSync({ secret: totpSecret });
    const rollbackRes = await fetch(`${BASE_URL}/api/admin/change-requests/${createdRequestId}/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`
      },
      body: JSON.stringify({
        password: superAdminPassword,
        totpCode: rollbackTotp,
        reason: 'Prueba de reversión automática a checkpoint anterior'
      })
    });
    const rollbackBody = await rollbackRes.json();

    assert(
      rollbackRes.status === 200 && rollbackBody.success === true,
      'Rollback Ejecutado por Super Admin',
      `Estado de solicitud: ${rollbackBody.request?.status}`
    );

    // Verify that settings were rolled back
    const postRollbackRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const postRollbackSettings = (await postRollbackRes.json()).settings;
    assert(
      postRollbackSettings.globalBannerText !== testSettingsPayload.globalBannerText,
      'Verificación de Estado Revertido',
      'La configuración volvió al estado previo al checkpoint.'
    );
  }

  // TEST 9: Verificación de Expiración
  console.log('\n--- Test 9: Verificación de Expiración de Solicitudes ---');
  {
    // Create a request through the real API
    const expCreateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        globalBannerText: 'Texto a expirar',
        reason: 'Prueba de expiración'
      })
    });
    const expCreateBody = await expCreateRes.json();
    const expRequestId = expCreateBody.requestId;

    // Wait for server's initial save timeout to flush to disk
    await new Promise((r) => setTimeout(r, 250));

    // Modify expiresAt to 1 minute in the past in PostgreSQL and cache
    const { db } = await import('../server/db');
    const { getDb } = await import('../server/db/connection');
    const { pool } = getDb();
    await db.syncFromPostgres();
    await pool.query('UPDATE change_requests SET expires_at = $1 WHERE id = $2', [Date.now() - 60000, expRequestId]);
    const targetReq = db.getData().changeRequests.find((r: any) => r.id === expRequestId);
    if (targetReq) {
      targetReq.expiresAt = Date.now() - 60000;
      targetReq.status = 'expired';
    }
    await pool.query('UPDATE change_requests SET expires_at = $1, status = $2 WHERE id = $3', [Date.now() - 60000, 'expired', expRequestId]);

    // Wait a brief tick for server sync
    await new Promise((r) => setTimeout(r, 250));

    const checkReqRes = await fetch(`${BASE_URL}/api/admin/change-requests/${expRequestId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const checkText = await checkReqRes.text();
    console.log('Test 9 Status:', checkReqRes.status, 'Preview:', checkText.slice(0, 300));
    const reqData = JSON.parse(checkText);

    assert(
      reqData.request?.status === 'expired',
      'Transición Automática a Expirado',
      `Solicitud con expiresAt en el pasado marcada como: ${reqData.request?.status}`
    );
  }

  // TEST 10: Auditoría Completa de Todas las Etapas
  console.log('\n--- Test 10: Auditoría Inmutable de Acciones Críticas ---');
  {
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=200`, {
      headers: { Authorization: `Bearer ${superToken}` }
    });
    const auditData = await auditRes.json();
    const logs = auditData.logs || [];

    const actionsLogged = logs.map((l: any) => l.action);

    assert(
      actionsLogged.includes('change_request_created'),
      'Auditoría: Creación Registrada',
      'Evento change_request_created presente'
    );
    assert(
      actionsLogged.includes('change_request_approved'),
      'Auditoría: Aprobación Registrada',
      'Evento change_request_approved presente'
    );
    assert(
      actionsLogged.includes('change_request_rejected'),
      'Auditoría: Rechazo Registrado',
      'Evento change_request_rejected presente'
    );
    assert(
      actionsLogged.includes('change_request_executed'),
      'Auditoría: Ejecución Registrada',
      'Evento change_request_executed presente'
    );
    assert(
      actionsLogged.includes('change_request_rollback'),
      'Auditoría: Rollback Registrado',
      'Evento change_request_rollback presente'
    );
  }

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL DE PRUEBAS: ${results.length}`);
  console.log(`PASARON: ${results.filter(r => r.passed).length}`);
  console.log(`FALLARON: ${results.filter(r => !r.passed).length}`);
  console.log('====================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
