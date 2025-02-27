import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const generateJWT = (payload: Record<string, unknown>): string => {
  const secret = Buffer.from(JWT_SECRET, 'utf-8');
  return jwt.sign(payload, secret, { 
    expiresIn: JWT_EXPIRES_IN 
  } as SignOptions);
};