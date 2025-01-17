import { FastifyRequest, FastifyReply } from 'fastify';
export interface SessionData {
    userId: string;
    role: string;
    permissions: string[];
    createdAt: number;
}
export declare const sessionMiddleware: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyPrefix?: string;
}
export declare const createRateLimiter: (config: RateLimitConfig) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export interface OTPData {
    code: string;
    purpose: string;
    expiresAt: number;
}
export declare const storeOTP: (userId: string, otpData: OTPData) => Promise<void>;
export declare const verifyOTP: (userId: string, code: string) => Promise<boolean>;
export interface CacheConfig {
    ttl: number;
    prefix?: string;
}
export declare const getFromCache: <T>(key: string, prefix?: string) => Promise<T | null>;
export declare const setInCache: <T>(key: string, data: T, { ttl, prefix }: CacheConfig) => Promise<void>;
export declare const deleteFromCache: (key: string, prefix?: string) => Promise<void>;
//# sourceMappingURL=redis.middleware.d.ts.map