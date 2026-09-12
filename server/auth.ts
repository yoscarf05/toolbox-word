import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { db, UserRecord, SessionRecord, UserRole } from './db';

export const HASH_ITERATIONS = 100000;
export const KEY_LENGTH = 64;
export const DIGEST = 'sha512';

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, generatedSalt, HASH_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

export function generateRecoveryCodes(count = 8): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    rawCodes.push(formatted);
    hashedCodes.push(hashRecoveryCode(formatted));
  }
  return { rawCodes, hashedCodes };
}

export function generateTotpSecret(userEmail: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: 'Toolbox Word',
    label: userEmail,
    secret
  });
  return { secret, otpauthUrl };
}

export async function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      token: token.trim(),
      secret: secret.trim()
    });
    return !!(result && result.valid);
  } catch (err) {
    return false;
  }
}

export function parseUserAgent(userAgentHeader = ''): { device: string; browser: string; os: string } {
  const ua = userAgentHeader.toLowerCase();
  let device = 'Desktop';
  if (ua.includes('mobi') || ua.includes('android')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';

  let os = 'Unknown';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ios')) os = 'iOS';

  return { device, browser, os };
}

export function createSession(
  user: UserRecord,
  req: { ip?: string; headers: Record<string, any> }
): SessionRecord {
  const id = crypto.randomBytes(32).toString('hex');
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ua = req.headers['user-agent'] || '';
  const { device, browser, os } = parseUserAgent(ua);
  const now = Date.now();
  const settings = db.getData().settings;
  const timeoutMs = (settings.sessionTimeoutMinutes || 120) * 60 * 1000;

  const session: SessionRecord = {
    id,
    userId: user.id,
    role: user.role,
    ip: String(ip).split(',')[0].trim(),
    userAgent: ua.slice(0, 200),
    device,
    browser,
    os,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + timeoutMs,
    isValid: true
  };

  db.getData().sessions.push(session);
  db.save();
  return session;
}

// Temporary in-memory pending 2FA challenges
export interface Pending2FAChallenge {
  tempToken: string;
  userId: string;
  expiresAt: number;
  setupMode?: boolean;
  secret?: string;
  recoveryCodes?: string[];
  attempts: number;
}

export const pendingChallenges = new Map<string, Pending2FAChallenge>();

// Clean up expired challenges periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, challenge] of pendingChallenges.entries()) {
    if (challenge.expiresAt < now) {
      pendingChallenges.delete(token);
    }
  }
}, 60000);

// Verify if Super Admin is present; if not, log notice to run bootstrap script
export function initializeSuperAdmin() {
  const users = db.getData().users;
  const existingSuperAdmin = users.find((u) => u.role === 'super_admin');

  if (!existingSuperAdmin) {
    console.log('[AUTH] No Super Admin account detected in database. Use "npm run bootstrap:superadmin" to provision the first Super Administrator.');
  } else {
    console.log(`[AUTH] Super Admin account active: ${existingSuperAdmin.email}`);
  }
}

// Sudo re-authentication token store (valid for 5 minutes after verifying password + TOTP)
export interface SudoTicket {
  userId: string;
  role: UserRole;
  expiresAt: number;
}
export const sudoTickets = new Map<string, SudoTicket>();

export function createSudoTicket(userId: string, role: UserRole): string {
  const ticketId = crypto.randomBytes(24).toString('hex');
  sudoTickets.set(ticketId, {
    userId,
    role,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  return ticketId;
}

export function verifySudoTicket(ticketId: string, userId: string): boolean {
  const ticket = sudoTickets.get(ticketId);
  if (!ticket) return false;
  if (ticket.userId !== userId || ticket.expiresAt < Date.now()) {
    sudoTickets.delete(ticketId);
    return false;
  }
  return true;
}
