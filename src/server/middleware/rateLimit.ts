import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store mapped by IP and bucket
const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

// Store for failed login attempts by normalized email (Prioridad 1-BIS.6)
const emailFailedAttemptsStore = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

function getLocalizedRateLimitMsg(lang: string, waitMinutes: number): string {
  if (lang.includes('en')) {
    return `Too many attempts. Please try again in ${waitMinutes} minute(s).`;
  }
  if (lang.includes('fr')) {
    return `Trop de tentatives. Veuillez réessayer dans ${waitMinutes} minute(s).`;
  }
  return `Demasiados intentos. Por favor, inténtalo de nuevo en ${waitMinutes} minuto(s).`;
}

export function createRateLimiter(bucketName: string, maxRequests: number, windowMs: number) {
  if (!rateLimitStores.has(bucketName)) {
    rateLimitStores.set(bucketName, new Map<string, RateLimitRecord>());
  }
  const bucket = rateLimitStores.get(bucketName)!;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const lang = (req.headers['accept-language'] as string) || 'es';

    const record = bucket.get(ip);

    if (!record || now > record.resetAt) {
      bucket.set(ip, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const waitMinutes = Math.ceil((record.resetAt - now) / 60000);
      res.status(429).json({
        error: getLocalizedRateLimitMsg(lang, waitMinutes),
        code: 'RATE_LIMIT_EXCEEDED',
        waitMinutes,
      });
      return;
    }

    record.count += 1;
    next();
  };
}

// 20 login attempts per 15 minutes per IP
export const loginRateLimiter = createRateLimiter('login', 20, 15 * 60 * 1000);

// 15 landlord code lookup / confirm attempts per 10 minutes per IP
export const landlordCodeRateLimiter = createRateLimiter('landlord_code', 15, 10 * 60 * 1000);

// ACCOUNT / EMAIL LEVEL RATE LIMITING (Prioridad 1-BIS.6)
// Prevents distributed IP brute-force attacks against a specific user account
const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;
const EMAIL_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export function checkEmailLoginAllowed(email: string): { allowed: boolean; waitMinutes?: number } {
  if (!email) return { allowed: true };
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const record = emailFailedAttemptsStore.get(key);

  if (!record) return { allowed: true };

  if (now > record.resetAt) {
    emailFailedAttemptsStore.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS_PER_EMAIL) {
    const waitMinutes = Math.ceil((record.resetAt - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

export function recordEmailLoginFailure(email: string): void {
  if (!email) return;
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const record = emailFailedAttemptsStore.get(key);

  if (!record || now > record.resetAt) {
    emailFailedAttemptsStore.set(key, {
      count: 1,
      resetAt: now + EMAIL_LOCKOUT_WINDOW_MS,
    });
  } else {
    record.count += 1;
  }
}

export function recordEmailLoginSuccess(email: string): void {
  if (!email) return;
  const key = email.trim().toLowerCase();
  emailFailedAttemptsStore.delete(key);
}

