import { FastifyRedis } from '@fastify/redis';
import { Role } from '@eduflow/prisma';
import * as TE from 'fp-ts/TaskEither';
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  validateSession,
} from '../service/session.service';

describe('SessionService', () => {
  let mockRedis: jest.Mocked<FastifyRedis>;

  const mockSessionData = {
    userId: '123',
    email: 'test@example.com',
    roles: [Role.STUDENT],
    permissions: [],
    lastActivity: Date.now(), // Changed to use timestamp instead of ISO string
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await createSession(
        mockRedis,
        mockSessionData.userId,
        mockSessionData.email,
        mockSessionData.roles,
        mockSessionData.ipAddress,
        mockSessionData.userAgent
      )();

      expect(result._tag).toBe('Right');
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const sessionData = {
        ...mockSessionData,
        lastActivity: new Date(mockSessionData.lastActivity).getTime() // Convert to timestamp
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await getSession(mockRedis, mockSessionData.userId)();

      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right).toEqual(mockSessionData);
      }
    });

    it('should return error for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await getSession(mockRedis, 'non-existent-id')();

      expect(result._tag).toBe('Left');
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockSessionData));
      mockRedis.set.mockResolvedValue('OK');

      const result = await updateSession(mockRedis, mockSessionData.userId, {
        ipAddress: mockSessionData.ipAddress,
        userAgent: mockSessionData.userAgent,
      })();

      expect(result._tag).toBe('Right');
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await deleteSession(mockRedis, mockSessionData.userId)();

      expect(result._tag).toBe('Right');
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should validate active session successfully', async () => {
      const activeSession = {
        ...mockSessionData,
        lastActivity: new Date().getTime() // Use timestamp instead of ISO string
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(activeSession));

      const result = await validateSession(mockRedis, mockSessionData.userId)();

      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right).toEqual(activeSession);
      }
    });

    it('should reject expired session', async () => {
      const expiredSession = {
        ...mockSessionData,
        lastActivity: Date.now() - (25 * 60 * 60 * 1000) // Use timestamp for expired date
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(expiredSession));

      const result = await validateSession(mockRedis, mockSessionData.userId)();

      expect(result._tag).toBe('Left');
    });
  });
});
