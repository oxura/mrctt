/**
 * Security utilities and configurations
 */

/**
 * Content Security Policy configuration
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Note: Remove unsafe-inline in production with nonce
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  publicForm: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < config.windowMs
    );
    
    if (validTimestamps.length >= config.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < 3600000 // Keep for 1 hour max
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup rate limiter every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);
}

/**
 * Check if a string contains potentially malicious content
 */
export function containsSuspiciousContent(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /eval\(/i,
    /expression\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return trimmed;
}

/**
 * Generate a fingerprint for the current browser session
 */
export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const nav = window.navigator;
  const screen = window.screen;
  
  const components = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset(),
    typeof window.sessionStorage !== 'undefined',
    typeof window.localStorage !== 'undefined',
  ];
  
  const str = components.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Check if the current environment is secure (HTTPS)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

/**
 * CSRF Token management
 */
class CSRFTokenManager {
  private token: string | null = null;

  generateToken(): string {
    if (typeof window === 'undefined') return '';
    
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    this.token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  validateToken(token: string): boolean {
    return this.token !== null && this.token === token;
  }

  resetToken(): void {
    this.token = null;
  }
}

export const csrfTokenManager = new CSRFTokenManager();
