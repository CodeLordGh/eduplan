import { FastifyRedis } from '@fastify/redis';
import { Role, User, UserStatus, VerificationStatus, EmploymentEligibilityStatus } from '@eduflow/prisma';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import { hashPassword, generateJWT } from '@eduflow/common';
import * as userRepo from '../repository/user.repository';
import * as redisService from './redis.service';
import * as sessionService from './session.service';
import { register, login, refresh, logout } from './auth.service';

// Mock dependencies
jest.mock('@eduflow/prisma', () => ({
  Role: {
    TEACHER: 'TEACHER',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    SCHOOL_HEAD: 'SCHOOL_HEAD',
    STUDENT: 'STUDENT'
  },
  UserStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE'
  },
  VerificationStatus: {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED'
  },
  EmploymentEligibilityStatus: {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE: 'INELIGIBLE'
  }
}));

jest.mock('@eduflow/common', () => ({
  hashPassword: jest.fn(),
  generateJWT: jest.fn(),
  verifyPassword: jest.fn()
}));

jest.mock('../repository/user.repository');
jest.mock('./redis.service');
jest.mock('./session.service');

describe('Auth Service', () => {
  let mockRedis: jest.Mocked<FastifyRedis>;
  
  beforeEach(() => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn()
    } as any;
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Password123!',
      roles: [Role.STUDENT],
      phone: '+1234567890'
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const newUser: Partial<User> = {
        id: '1',
        email: validInput.email,
        roles: validInput.roles,
        status: UserStatus.PENDING
      };

      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (userRepo.findUserByEmail as jest.Mock).mockImplementation(() => TE.right(null));
      (userRepo.createUser as jest.Mock).mockImplementation(() => TE.right(newUser));

      const result = await pipe(
        register(validInput),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (user) => T.of(Promise.resolve(user))
        )
      )();

      expect(result).toEqual(newUser);
      expect(hashPassword).toHaveBeenCalledWith(validInput.password);
      expect(userRepo.createUser).toHaveBeenCalledWith({
        email: validInput.email,
        password: hashedPassword,
        roles: validInput.roles,
        phone: validInput.phone
      });
    });

    it('should fail if email already exists', async () => {
      const existingUser: Partial<User> = {
        id: '1',
        email: validInput.email
      };

      (userRepo.findUserByEmail as jest.Mock).mockImplementation(() => TE.right(existingUser));

      await expect(pipe(
        register(validInput),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (user) => T.of(Promise.resolve(user))
        )
      )()).rejects.toMatchObject({
        message: expect.stringContaining('email already exists')
      });
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'Password123!',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    };

    const mockUser: Partial<User> = {
      id: '1',
      email: loginInput.email,
      password: 'hashedPassword',
      roles: [Role.STUDENT],
      status: UserStatus.ACTIVE,
      kycStatus: VerificationStatus.VERIFIED,
      employmentStatus: EmploymentEligibilityStatus.ELIGIBLE
    };

    it('should successfully login a user', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      (userRepo.findUserByEmail as jest.Mock).mockImplementation(() => TE.right(mockUser));
      (redisService.storeRefreshToken as jest.Mock).mockImplementation(() => TE.right(undefined));
      (sessionService.createSession as jest.Mock).mockImplementation(() => TE.right(undefined));
      (generateJWT as jest.Mock).mockReturnValue(mockTokens.accessToken);

      const result = await pipe(
        login(mockRedis, loginInput),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (authResult) => T.of(Promise.resolve(authResult))
        )
      )();

      expect(result).toMatchObject({
        user: mockUser,
        accessToken: mockTokens.accessToken,
        refreshToken: expect.any(String)
      });
    });

    it('should fail if user not found', async () => {
      (userRepo.findUserByEmail as jest.Mock).mockImplementation(() => TE.right(null));

      await expect(pipe(
        login(mockRedis, loginInput),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (authResult) => T.of(Promise.resolve(authResult))
        )
      )()).rejects.toMatchObject({
        message: expect.stringContaining('user not found')
      });
    });
  });

  describe('refresh', () => {
    const refreshInput = {
      refreshToken: 'valid-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    };

    const mockUser: Partial<User> = {
      id: '1',
      email: 'test@example.com',
      roles: [Role.STUDENT],
      status: UserStatus.ACTIVE,
      kycStatus: VerificationStatus.VERIFIED,
      employmentStatus: EmploymentEligibilityStatus.ELIGIBLE
    };

    it('should successfully refresh tokens', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      (redisService.getRefreshTokenUserId as jest.Mock).mockImplementation(() => 
        TE.right({ _tag: 'Some', value: mockUser.id }));
      (userRepo.findUserById as jest.Mock).mockImplementation(() => TE.right(mockUser));
      (redisService.storeRefreshToken as jest.Mock).mockImplementation(() => TE.right(undefined));
      (sessionService.updateSession as jest.Mock).mockImplementation(() => TE.right(undefined));
      (generateJWT as jest.Mock).mockReturnValue(mockTokens.accessToken);

      const result = await pipe(
        refresh(mockRedis, refreshInput.refreshToken, refreshInput.ipAddress, refreshInput.userAgent),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (authResult) => T.of(Promise.resolve(authResult))
        )
      )();

      expect(result).toMatchObject({
        user: mockUser,
        accessToken: mockTokens.accessToken,
        refreshToken: expect.any(String)
      });
    });

    it('should fail if refresh token is invalid', async () => {
      (redisService.getRefreshTokenUserId as jest.Mock).mockImplementation(() => 
        TE.right({ _tag: 'None' }));

      await expect(pipe(
        refresh(mockRedis, refreshInput.refreshToken, refreshInput.ipAddress, refreshInput.userAgent),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (authResult) => T.of(Promise.resolve(authResult))
        )
      )()).rejects.toMatchObject({
        message: expect.stringContaining('invalid credentials')
      });
    });
  });

  describe('logout', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockUserId = '1';

    it('should successfully logout a user', async () => {
      (redisService.getRefreshTokenUserId as jest.Mock).mockImplementation(() => 
        TE.right({ _tag: 'Some', value: mockUserId }));
      (redisService.deleteRefreshToken as jest.Mock).mockImplementation(() => TE.right(undefined));
      (sessionService.deleteSession as jest.Mock).mockImplementation(() => TE.right(undefined));

      const result = await pipe(
        logout(mockRedis, mockRefreshToken),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (value) => T.of(Promise.resolve(value))
        )
      )();

      expect(result).toBeUndefined();
      expect(redisService.deleteRefreshToken).toHaveBeenCalledWith(mockRedis, mockRefreshToken);
      expect(sessionService.deleteSession).toHaveBeenCalledWith(mockRedis, mockUserId);
    });

    it('should fail if refresh token is invalid', async () => {
      (redisService.getRefreshTokenUserId as jest.Mock).mockImplementation(() => 
        TE.right({ _tag: 'None' }));

      await expect(pipe(
        logout(mockRedis, mockRefreshToken),
        TE.fold(
          (error) => T.of(Promise.reject(error)),
          (value) => T.of(Promise.resolve(value))
        )
      )()).rejects.toMatchObject({
        message: expect.stringContaining('invalid credentials')
      });
    });
  });
}); 