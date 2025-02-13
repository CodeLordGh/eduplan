import { createEventService } from '../service/event.service';
import { Redis } from 'ioredis';
import { PrismaClient } from '@eduflow/prisma';

describe('Event Service', () => {
  const mockRedis = {
    publish: jest.fn().mockResolvedValue(1),
  } as unknown as Redis;

  const mockPrisma = {
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaClient;

  const deps = {
    redis: mockRedis,
    prisma: mockPrisma,
  };

  const eventService = createEventService(deps);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleKYCVerified', () => {
    it('should handle KYC verified event', async () => {
      const event = {
        userId: '123',
        status: 'VERIFIED',
        type: 'IDENTITY',
      };

      await eventService.handleKYCVerified(event);
      expect(mockRedis.publish).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('handleKYCRejected', () => {
    it('should handle KYC rejected event', async () => {
      const event = {
        userId: '123',
        status: 'REJECTED',
        type: 'IDENTITY',
      };

      await eventService.handleKYCRejected(event);
      expect(mockRedis.publish).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});
