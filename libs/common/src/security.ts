import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Permission, Role } from '@eduflow/types';
import { pipe } from 'fp-ts/function';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

// Environment configuration
const getConfig = () => ({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
});

// Password Hashing
export const hashPassword = (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

export const verifyPassword = (hash: string, password: string): Promise<boolean> =>
  argon2.verify(hash, password);

// JWT Handling
export const generateJWT = (payload: JWTPayload): string =>
  jwt.sign(payload, getConfig().jwtSecret, {
    expiresIn: getConfig().jwtExpiresIn,
  });

export const generateRefreshToken = (): string => randomBytes(40).toString('hex');

export const verifyJWT = (token: string): JWTPayload =>
  jwt.verify(token, getConfig().jwtSecret) as JWTPayload;

// OTP Generation
export const generateOTP = (): string =>
  pipe(
    randomBytes(4),
    (bytes: Buffer): number => bytes.readUInt32BE(0),
    (num: number): string => num.toString(),
    (str: string): string => str.padStart(8, '0'),
    (str: string): string => str.slice(-8)
  );

// Token Encryption
const generateIV = (): Buffer => randomBytes(16);

const getEncryptionKey = (): Buffer => Buffer.from(getConfig().encryptionKey, 'hex');

export const encryptToken = (token: string): string => {
  const iv = generateIV();
  const key = getEncryptionKey();
  const cipher = createCipheriv('aes-256-cbc', key, iv);

  return pipe(
    cipher.update(token, 'utf8', 'hex'),
    (encrypted: string): string => encrypted + cipher.final('hex'),
    (encrypted: string): string => `${iv.toString('hex')}:${encrypted}`
  );
};

export const decryptToken = (encryptedToken: string): string => {
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getEncryptionKey();
  const decipher = createDecipheriv('aes-256-cbc', key, iv);

  return pipe(
    decipher.update(encrypted, 'hex', 'utf8'),
    (decrypted: string): string => decrypted + decipher.final('utf8')
  );
};

// Role and Permission Validation
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => userPermissions.includes(requiredPermission);

export const isRoleAuthorized = (
  userRole: Role,
  requiredRole: Role,
  roleHierarchy: Record<Role, Role[]>
): boolean => userRole === requiredRole || roleHierarchy[requiredRole].includes(userRole);

// Security Headers
export const getSecurityHeaders = (): Record<string, string> => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
});
