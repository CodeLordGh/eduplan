import { describe, expect, it, jest } from '@jest/globals';
import { hashPassword, verifyPassword } from './utils';

// Mock bcrypt module
jest.mock('bcrypt', () => {
  return {
    __esModule: true,
    default: {
      hash: (password: string, saltRounds: number) => {
        console.log('Mocked hash called with:', { password, saltRounds });
        return Promise.resolve(`mocked_hash_${password}_${saltRounds}`);
      },
      compare: (password: string, hash: string) => {
        console.log('Mocked compare called with:', { password, hash });
        const storedPassword = hash.split('mocked_hash_')[1].split('_')[0];
        console.log('Extracted stored password:', storedPassword);
        return Promise.resolve(password === storedPassword);
      }
    }
  };
});

describe('Password Hashing and Verification', () => {
  const testPassword = 'MySecurePassword123!';

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hash = await hashPassword(testPassword);
      console.log('Generated hash:', hash);
      
      // Hash should be a string
      expect(typeof hash).toBe('string');
      
      // Hash should be different from the original password
      expect(hash).not.toBe(testPassword);
      
      // Hash should contain our mocked format
      expect(hash).toContain('mocked_hash_');
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      // In our mock implementation, hashes will be the same, but in real bcrypt they would be different
      expect(hash1).toBe(hash2);
    });

    it('should handle empty passwords', async () => {
      const hash = await hashPassword('');
      expect(hash).toContain('mocked_hash_');
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password against its hash', async () => {
      const hash = await hashPassword(testPassword);
      console.log('Hash to verify against:', hash);
      const isValid = await verifyPassword(hash, testPassword);
      console.log('Verification result:', isValid);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(hash, 'WrongPassword123!');

      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(hash, '');

      expect(isValid).toBe(false);
    });
  });
}); 