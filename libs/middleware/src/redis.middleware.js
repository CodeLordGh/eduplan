"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCache = exports.setInCache = exports.getFromCache = exports.verifyOTP = exports.storeOTP = exports.createRateLimiter = exports.sessionMiddleware = void 0;
const ioredis_1 = require("ioredis");
// Redis client configuration
const createRedisClient = (config) => new ioredis_1.Redis({
    host: config?.host || process.env.REDIS_HOST || 'localhost',
    port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
    password: config?.password || process.env.REDIS_PASSWORD,
    db: config?.db || parseInt(process.env.REDIS_DB || '0')
});
// Shared Redis client instance
const redis = createRedisClient();
const getSessionId = (request) => request.headers['session-id'] || null;
const getSession = async (sessionId) => {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
};
const sessionMiddleware = async (request, reply) => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        reply.status(401).send({ error: 'No session ID provided' });
        return;
    }
    const session = await getSession(sessionId);
    if (!session) {
        reply.status(401).send({ error: 'Invalid or expired session' });
        return;
    }
    request.session = session;
};
exports.sessionMiddleware = sessionMiddleware;
const incrementCounter = async (key) => redis.incr(key);
const setExpiry = async (key, windowMs) => {
    await redis.pexpire(key, windowMs);
};
const getRemainingTime = async (key) => redis.pttl(key);
const setRateLimitHeaders = (reply, max, current, reset) => {
    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', Math.max(0, max - current));
    reply.header('X-RateLimit-Reset', reset);
};
const createRateLimiter = (config) => async (request, reply) => {
    const { windowMs, max, keyPrefix = 'ratelimit:' } = config;
    const key = `${keyPrefix}${request.ip}`;
    const current = await incrementCounter(key);
    if (current === 1) {
        await setExpiry(key, windowMs);
    }
    const ttl = await getRemainingTime(key);
    setRateLimitHeaders(reply, max, current, Date.now() + ttl);
    if (current > max) {
        reply.status(429).send({
            error: 'Too many requests',
            retryAfter: Math.ceil(ttl / 1000)
        });
    }
};
exports.createRateLimiter = createRateLimiter;
const createOTPKey = (userId) => `otp:${userId}`;
const storeOTP = async (userId, otpData) => {
    const key = createOTPKey(userId);
    await redis.set(key, JSON.stringify(otpData), 'PX', otpData.expiresAt - Date.now());
};
exports.storeOTP = storeOTP;
const getStoredOTP = async (userId) => {
    const data = await redis.get(createOTPKey(userId));
    return data ? JSON.parse(data) : null;
};
const deleteOTP = async (userId) => {
    await redis.del(createOTPKey(userId));
};
const verifyOTP = async (userId, code) => {
    const otpData = await getStoredOTP(userId);
    if (!otpData)
        return false;
    const isValid = otpData.code === code && Date.now() <= otpData.expiresAt;
    await deleteOTP(userId);
    return isValid;
};
exports.verifyOTP = verifyOTP;
const createCacheKey = (key, prefix = 'cache:') => `${prefix}${key}`;
const getFromCache = async (key, prefix = 'cache:') => {
    const data = await redis.get(createCacheKey(key, prefix));
    return data ? JSON.parse(data) : null;
};
exports.getFromCache = getFromCache;
const setInCache = async (key, data, { ttl, prefix = 'cache:' }) => {
    await redis.set(createCacheKey(key, prefix), JSON.stringify(data), 'PX', ttl);
};
exports.setInCache = setInCache;
const deleteFromCache = async (key, prefix = 'cache:') => {
    await redis.del(createCacheKey(key, prefix));
};
exports.deleteFromCache = deleteFromCache;
//# sourceMappingURL=redis.middleware.js.map