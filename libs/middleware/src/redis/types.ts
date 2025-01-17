export interface SessionData {
  userId: string;
  role: string;
  permissions: string[];
  createdAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface OTPData {
  code: string;
  purpose: string;
  expiresAt: number;
}

export interface CacheConfig {
  ttl: number;
  prefix?: string;
} 