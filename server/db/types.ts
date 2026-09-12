export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  permissions: string[];
  totpSecret?: string;
  totpEnabled: boolean;
  recoveryCodes: string[]; // hashed recovery codes
  status: 'active' | 'blocked';
  createdAt: number;
  lastLoginAt?: number;
  failedLoginAttempts: number;
  lockedUntil?: number;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  role: UserRole;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  isValid: boolean;
}

export interface AnalyticsEventRecord {
  id: string;
  type: string;
  toolSlug?: string;
  category?: string;
  durationMs?: number;
  status?: 'success' | 'failed';
  errorType?: string;
  path?: string;
  ipHash?: string;
  userAgent?: string;
  timestamp: number;
}

export interface SystemErrorRecord {
  id: string;
  timestamp: number;
  tool?: string;
  errorType: string;
  technicalMessage: string;
  endpoint?: string;
  browser?: string;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  frequency: number;
  lastSeenAt: number;
}

export interface AuditLogRecord {
  id: string;
  timestamp: number;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  details: Record<string, any>;
  ip: string;
  status: 'success' | 'denied';
}

export interface AdminAlertRecord {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  read: boolean;
  resolvedAt?: number;
}

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'executed' | 'rolled_back';

export interface ChangeRequestRecord {
  id: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  action: string;
  actionLabel: string;
  targetResource: string;
  sanitizedParams: Record<string, any>;
  paramsHash: string;
  riskLevel: 'critical' | 'high';
  reason: string;
  potentialConsequences: string;
  status: ChangeRequestStatus;
  createdAt: number;
  expiresAt: number;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    reviewedAt: number;
  };
  reviewNotes?: string;
  authorizationTokenHash?: string;
  authorizationTokenExpiresAt?: number;
  usedAt?: number;
  executedBy?: {
    id: string;
    email: string;
    executedAt: number;
  };
  checkpointData?: Record<string, any>;
  rollbackAt?: number;
  rollbackBy?: {
    id: string;
    email: string;
  };
}

export interface SystemSettingsRecord {
  adsEnabled: boolean;
  maintenanceMode: boolean;
  globalBannerText: string;
  bannerEnabled: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  updatedAt: number;
}

export interface FeedbackRecord {
  id: string;
  type: string;
  userId?: string;
  email?: string;
  toolSlug?: string;
  message: string;
  rating?: number;
  status: string;
  createdAt: number;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  analyticsEvents: AnalyticsEventRecord[];
  systemErrors: SystemErrorRecord[];
  auditLogs: AuditLogRecord[];
  adminAlerts: AdminAlertRecord[];
  changeRequests: ChangeRequestRecord[];
  settings: SystemSettingsRecord;
}
