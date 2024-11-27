import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Rate limiting configuration
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(username: string, remember: boolean = false): string {
  return jwt.sign(
    { username },
    import.meta.env.JWT_SECRET,
    { expiresIn: remember ? '30d' : '24h' }
  );
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, import.meta.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function checkRateLimit(ip: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.resetTime) {
      loginAttempts.delete(key);
    }
  }

  const attempt = loginAttempts.get(ip);

  // If no previous attempts or reset time has passed
  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOCK_TIME });
    return { allowed: true };
  }

  // If under max attempts
  if (attempt.count < MAX_ATTEMPTS) {
    attempt.count += 1;
    loginAttempts.set(ip, attempt);
    return { allowed: true };
  }

  // If locked out
  const waitTime = attempt.resetTime - now;
  return { allowed: false, waitTime };
}

// Audit logging
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  username: string;
  ip: string;
  details?: any;
}

let auditLog: AuditLogEntry[] = [];

export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>) {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  auditLog.push(logEntry);

  // Keep only last 1000 entries
  if (auditLog.length > 1000) {
    auditLog = auditLog.slice(-1000);
  }

  // Log to console for debugging
  console.log('Audit Log:', logEntry);
}

export function getAuditLog(filters?: {
  username?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLogEntry[] {
  let filteredLog = [...auditLog];

  if (filters) {
    if (filters.username) {
      filteredLog = filteredLog.filter(entry => entry.username === filters.username);
    }
    if (filters.action) {
      filteredLog = filteredLog.filter(entry => entry.action === filters.action);
    }
    if (filters.startDate) {
      filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) <= filters.endDate!);
    }
  }

  return filteredLog;
}
