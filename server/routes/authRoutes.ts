import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, UserRecord } from '../db';
import {
  verifyPassword,
  hashPassword,
  createSession,
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
  pendingChallenges,
  createSudoTicket
} from '../auth';
import {
  AuthenticatedRequest,
  rateLimiter,
  requireAuth,
  logAudit
} from '../middleware';

export const authRouter = express.Router();

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    totpEnabled: user.totpEnabled,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    isSuperAdmin: user.role === 'super_admin',
    isAdmin: user.role === 'admin' || user.role === 'super_admin'
  };
}

// 1. Unified Login (Email + Password only. Role is determined securely server-side)
authRouter.post(
  '/login',
  rateLimiter({ windowMs: 60000, max: 10, actionName: 'auth_login', message: 'Demasiados intentos de inicio de sesión.' }),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Credenciales incompletas', message: 'Por favor ingresa correo y contraseña.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const data = db.getData();
      const user = data.users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        // Constant-time simulation to prevent timing attacks
        verifyPassword(password, '0'.repeat(128), '0'.repeat(32));
        return res.status(401).json({ error: 'InvalidCredentials', message: 'Credenciales inválidas.' });
      }

      // Check account lockout
      const now = Date.now();
      if (user.lockedUntil && user.lockedUntil > now) {
        const remainingMin = Math.ceil((user.lockedUntil - now) / 60000);
        return res.status(423).json({
          error: 'AccountLocked',
          message: `Cuenta bloqueada temporalmente por seguridad. Intenta nuevamente en ${remainingMin} minutos.`
        });
      }

      // Verify password
      const isMatch = verifyPassword(password, user.passwordHash, user.salt);
      if (!isMatch) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= (data.settings.maxLoginAttempts || 5)) {
          const lockMs = (data.settings.lockoutMinutes || 15) * 60 * 1000;
          user.lockedUntil = now + lockMs;
          user.failedLoginAttempts = 0;

          // Alert for Super Admin
          data.adminAlerts.unshift({
            id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            severity: 'warning',
            type: 'account_locked',
            message: `Cuenta ${user.email} bloqueada por múltiples intentos fallidos de contraseña.`,
            read: false
          });
        }
        db.save();
        return res.status(401).json({ error: 'InvalidCredentials', message: 'Credenciales inválidas.' });
      }

      // Check if blocked by admin
      if (user.status === 'blocked') {
        return res.status(403).json({ error: 'AccountBlocked', message: 'Esta cuenta ha sido suspendida. Contacta a soporte.' });
      }

      // Reset failed attempts on valid password
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      db.save();

      // ROLE HANDLING:
      // If role === 'super_admin', TOTP is MANDATORY ALWAYS!
      if (user.role === 'super_admin') {
        const tempToken = crypto.randomBytes(32).toString('hex');

        if (!user.totpEnabled) {
          // Initial setup flow for Super Admin
          const totp = generateTotpSecret(user.email);
          const qrCodeDataUrl = await generateQrCodeDataUrl(totp.otpauthUrl);
          const recovery = generateRecoveryCodes(8);

          pendingChallenges.set(tempToken, {
            tempToken,
            userId: user.id,
            expiresAt: now + 10 * 60 * 1000, // 10 minutes for setup
            setupMode: true,
            secret: totp.secret,
            recoveryCodes: recovery.hashedCodes,
            attempts: 0
          });

          return res.json({
            setup2FA: true,
            requires2FA: true,
            tempToken,
            secret: totp.secret,
            qrCodeDataUrl,
            recoveryCodes: recovery.rawCodes,
            message: 'Configuración de segundo factor (TOTP) requerida para la cuenta de Super Administrador.'
          });
        }

        // Standard 2FA requirement for Super Admin (NEVER SKIP!)
        pendingChallenges.set(tempToken, {
          tempToken,
          userId: user.id,
          expiresAt: now + 5 * 60 * 1000, // 5 minutes
          setupMode: false,
          attempts: 0
        });

        return res.json({
          requires2FA: true,
          tempToken,
          message: 'Introduce el código de autenticación de 6 dígitos de tu aplicación TOTP.'
        });
      }

      // Normal User or Regular Admin:
      const session = createSession(user, req);
      user.lastLoginAt = now;
      db.save();

      res.cookie('toolbox_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (data.settings.sessionTimeoutMinutes || 120) * 60 * 1000
      });

      return res.json({
        success: true,
        user: sanitizeUser(user),
        token: session.id
      });
    } catch (err: any) {
      console.error('[AUTH] Login error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error procesando el inicio de sesión.' });
    }
  }
);

// 2. Verify TOTP 2FA (for Super Admin)
authRouter.post(
  '/verify-2fa',
  rateLimiter({ windowMs: 60000, max: 10, actionName: 'auth_verify_2fa', message: 'Demasiados intentos de verificación 2FA.' }),
  async (req: Request, res: Response) => {
    try {
      const { tempToken, code } = req.body;
      if (!tempToken || !code) {
        return res.status(400).json({ error: 'Datos incompletos', message: 'Código y token temporal requeridos.' });
      }

      const challenge = pendingChallenges.get(tempToken);
      if (!challenge || challenge.expiresAt < Date.now()) {
        if (challenge) pendingChallenges.delete(tempToken);
        return res.status(401).json({ error: 'SessionExpired', message: 'El tiempo para ingresar el segundo factor ha expirado. Inicia sesión nuevamente.' });
      }

      const data = db.getData();
      const user = data.users.find((u) => u.id === challenge.userId);
      if (!user) {
        pendingChallenges.delete(tempToken);
        return res.status(401).json({ error: 'UserNotFound', message: 'Usuario no encontrado.' });
      }

      challenge.attempts = (challenge.attempts || 0) + 1;
      if (challenge.attempts > 5) {
        pendingChallenges.delete(tempToken);
        data.adminAlerts.unshift({
          id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          severity: 'critical',
          type: '2fa_attempts_exceeded',
          message: `Alerta de seguridad: Múltiples códigos 2FA inválidos para cuenta ${user.email}.`,
          read: false
        });
        db.save();
        return res.status(429).json({ error: 'TooManyAttempts', message: 'Demasiados intentos fallidos de 2FA. Inicia sesión nuevamente.' });
      }

      const cleanCode = String(code).trim().replace(/\s+/g, '');

      // Check if it's setup mode
      if (challenge.setupMode && challenge.secret) {
        const isValid = verifyTotp(cleanCode, challenge.secret);
        if (!isValid) {
          return res.status(400).json({ error: 'InvalidCode', message: 'Código de autenticación incorrecto. Verifica la hora en tu dispositivo y app.' });
        }

        // Activate TOTP on user record
        user.totpSecret = challenge.secret;
        user.totpEnabled = true;
        user.recoveryCodes = challenge.recoveryCodes || [];
      } else {
        // Normal verification: either TOTP or single-use recovery code
        let isValid = false;
        if (user.totpSecret) {
          isValid = verifyTotp(cleanCode, user.totpSecret);
        }

        // If not matching TOTP, check single-use recovery codes
        if (!isValid && user.recoveryCodes && user.recoveryCodes.length > 0) {
          const hashedInput = hashRecoveryCode(cleanCode);
          const index = user.recoveryCodes.indexOf(hashedInput);
          if (index !== -1) {
            // Burn recovery code permanently
            user.recoveryCodes.splice(index, 1);
            isValid = true;
            data.adminAlerts.unshift({
              id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              severity: 'warning',
              type: 'recovery_code_used',
              message: `Código de recuperación utilizado por ${user.email}. Quedan ${user.recoveryCodes.length} códigos de respaldo.`,
              read: false
            });
          }
        }

        if (!isValid) {
          return res.status(400).json({ error: 'InvalidCode', message: 'Código de autenticación o código de respaldo inválido.' });
        }
      }

      // Success! Invalidate temp challenge
      pendingChallenges.delete(tempToken);

      // Create session
      const session = createSession(user, req);
      user.lastLoginAt = Date.now();
      db.save();

      // Log successful login
      logAudit(
        { user, sessionRecord: session } as AuthenticatedRequest,
        'super_admin_login_totp_success',
        'auth/session',
        { method: challenge.setupMode ? 'totp_setup_verified' : 'totp_verified' },
        'success'
      );

      res.cookie('toolbox_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (data.settings.sessionTimeoutMinutes || 120) * 60 * 1000
      });

      return res.json({
        success: true,
        user: sanitizeUser(user),
        token: session.id
      });
    } catch (err: any) {
      console.error('[AUTH] 2FA verification error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error verificando código 2FA.' });
    }
  }
);

// 3. Sudo Mode Re-authentication for Critical Actions
authRouter.post(
  '/reauth',
  requireAuth,
  rateLimiter({ windowMs: 60000, max: 5, actionName: 'auth_reauth', message: 'Demasiados intentos de reautenticación.' }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { password, totpCode } = req.body;
      const user = req.user!;

      if (!password) {
        return res.status(400).json({ error: 'PasswordRequired', message: 'Contraseña requerida para confirmar acción sensible.' });
      }

      const isPassValid = verifyPassword(password, user.passwordHash, user.salt);
      if (!isPassValid) {
        logAudit(req, 'sudo_reauth_failed', 'security/reauth', { reason: 'bad_password' }, 'denied');
        return res.status(401).json({ error: 'InvalidPassword', message: 'Contraseña incorrecta.' });
      }

      if (user.role === 'super_admin') {
        if (!totpCode) {
          return res.status(400).json({ error: 'TotpRequired', message: 'Código TOTP requerido para reautenticación de Super Admin.' });
        }
        const isTotpValid = user.totpSecret ? verifyTotp(String(totpCode), user.totpSecret) : false;
        if (!isTotpValid) {
          logAudit(req, 'sudo_reauth_failed', 'security/reauth', { reason: 'bad_totp' }, 'denied');
          return res.status(401).json({ error: 'InvalidTotp', message: 'Código TOTP incorrecto.' });
        }
      }

      const sudoTicket = createSudoTicket(user.id, user.role);
      logAudit(req, 'sudo_reauth_granted', 'security/reauth', {}, 'success');

      return res.json({
        success: true,
        sudoTicket,
        expiresInSeconds: 300
      });
    } catch (err) {
      console.error('[AUTH] Reauth error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error en proceso de reautenticación.' });
    }
  }
);

// 4. Standard User Registration (Always sets role='user')
authRouter.post(
  '/register',
  rateLimiter({ windowMs: 60000, max: 5, actionName: 'auth_register', message: 'Límite de registros alcanzado temporalmente.' }),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'MissingFields', message: 'Correo y contraseña requeridos.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name || 'Usuario').trim().slice(0, 80);

      const data = db.getData();
      const existing = data.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(409).json({ error: 'EmailExists', message: 'Este correo ya tiene una cuenta registrada.' });
      }

      const { hash, salt } = hashPassword(password);
      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash: hash,
        salt,
        role: 'user', // NEVER allow user to self-assign admin/super_admin
        permissions: [],
        totpEnabled: false,
        recoveryCodes: [],
        status: 'active',
        createdAt: Date.now(),
        failedLoginAttempts: 0
      };

      data.users.push(newUser);
      const session = createSession(newUser, req);
      db.save();

      res.cookie('toolbox_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (data.settings.sessionTimeoutMinutes || 120) * 60 * 1000
      });

      return res.json({
        success: true,
        user: sanitizeUser(newUser),
        token: session.id
      });
    } catch (err) {
      console.error('[AUTH] Register error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error procesando registro.' });
    }
  }
);

// 5. Current Authenticated User ('/me')
authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.sessionRecord) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: sanitizeUser(req.user),
    sessionId: req.sessionRecord.id,
    sessionExpiresAt: req.sessionRecord.expiresAt
  });
});

// 6. Logout (Server-side session invalidation + cookie cleanup)
authRouter.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionRecord) {
    req.sessionRecord.isValid = false;
    db.save();

    if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
      logAudit(req, 'admin_logout', 'auth/session', { sessionId: req.sessionRecord.id });
    }
  }

  res.clearCookie('toolbox_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  return res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
});

// 7. Active sessions management
authRouter.get('/sessions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const now = Date.now();
  const userSessions = data.sessions
    .filter((s) => s.userId === req.user!.id && s.isValid && s.expiresAt > now)
    .map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === req.sessionRecord!.id
    }));

  return res.json({ sessions: userSessions });
});

authRouter.delete('/sessions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const data = db.getData();
  const session = data.sessions.find((s) => s.id === targetId && s.userId === req.user!.id);

  if (session) {
    session.isValid = false;
    db.save();
    logAudit(req, 'session_revoked', 'auth/session', { targetSessionId: targetId });
  }

  return res.json({ success: true, message: 'Sesión revocada correctamente.' });
});

authRouter.post('/sessions/revoke-others', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const currentId = req.sessionRecord!.id;
  let count = 0;

  for (const s of data.sessions) {
    if (s.userId === req.user!.id && s.id !== currentId && s.isValid) {
      s.isValid = false;
      count++;
    }
  }
  db.save();

  logAudit(req, 'revoke_other_sessions', 'auth/session', { revokedCount: count });
  return res.json({ success: true, count, message: `${count} sesiones cerradas.` });
});

// 8. Secure Password Recovery Flow
authRouter.post(
  '/forgot-password',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, actionName: 'auth_forgot_password', message: 'Demasiadas solicitudes de recuperación. Intenta más tarde.' }),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'MissingEmail', message: 'Ingresa un correo electrónico válido.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const data = db.getData();
      const user = data.users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (user && user.status !== 'blocked') {
        // Generate single-use secure cryptographic token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordTokenHash = tokenHash;
        user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiration
        db.save();

        console.log(`[AUTH-RECOVERY] Password recovery token generated for account. Expiration: 1 hour.`);
      }

      // Consistent response to prevent user email enumeration (OWASP Best Practice)
      return res.json({
        success: true,
        message: 'Si el correo electrónico está registrado en nuestro sistema, recibirás las instrucciones para restablecer tu contraseña.'
      });
    } catch (err) {
      console.error('[AUTH] Forgot password error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error procesando solicitud de recuperación.' });
    }
  }
);

authRouter.post(
  '/reset-password',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, actionName: 'auth_reset_password', message: 'Demasiados intentos. Espera unos minutos.' }),
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({
          error: 'MissingFields',
          message: 'Se requiere el token de recuperación y la nueva contraseña.'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'WeakPassword',
          message: 'La nueva contraseña debe tener al menos 8 caracteres.'
        });
      }

      const rawToken = token.trim();
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const now = Date.now();
      const data = db.getData();

      const user = data.users.find(
        (u) =>
          u.resetPasswordTokenHash === tokenHash &&
          u.resetPasswordExpiresAt !== undefined &&
          u.resetPasswordExpiresAt > now
      );

      if (!user) {
        return res.status(400).json({
          error: 'InvalidOrExpiredToken',
          message: 'El enlace o código de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.'
        });
      }

      // Hash new password with PBKDF2
      const { hash, salt } = hashPassword(newPassword);
      user.passwordHash = hash;
      user.salt = salt;

      // Invalidate recovery token (single-use guarantee)
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpiresAt = undefined;

      // Reset any prior failed login attempts and unlock
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;

      // Invalidate ALL prior active sessions for this user across all devices
      for (const s of data.sessions) {
        if (s.userId === user.id) {
          s.isValid = false;
        }
      }

      db.save();

      return res.json({
        success: true,
        message: 'Tu contraseña ha sido restablecida exitosamente. Todas las sesiones activas han sido cerradas por seguridad.'
      });
    } catch (err) {
      console.error('[AUTH] Reset password error:', err);
      return res.status(500).json({ error: 'InternalServerError', message: 'Error al restablecer contraseña.' });
    }
  }
);
