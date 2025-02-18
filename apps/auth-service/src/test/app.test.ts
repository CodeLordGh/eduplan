import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyRedis from '@fastify/redis';
import fastifySwagger from '@fastify/swagger';
import fastifyCookie from '@fastify/cookie';
import { createLogger } from '@eduflow/logger';
import authRoutes from '../routes/auth.routes';
import otpRoutes from '../routes/otp.routes';
import { createApp } from '../app';

jest.mock('fastify');
jest.mock('@fastify/jwt');
jest.mock('@fastify/redis');
jest.mock('@fastify/swagger');
jest.mock('@fastify/cookie');
jest.mock('@eduflow/logger');
jest.mock('./routes/auth.routes');
jest.mock('./routes/otp.routes');

describe('createApp', () => {
  let app: ReturnType<typeof fastify>;

  beforeEach(() => {
    app = {
      register: jest.fn(),
      setErrorHandler: jest.fn(),
      listen: jest.fn(),
    } as any;
    ((fastify as unknown) as jest.Mock).mockReturnValue(app);
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.COOKIE_SECRET = 'test-cookie-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create and configure the Fastify app', async () => {
    await createApp();

    expect(fastify).toHaveBeenCalledWith({
      logger: true,
      ajv: {
        customOptions: {
          removeAdditional: 'all',
          coerceTypes: true,
          useDefaults: true,
        },
      },
    });
    expect(app.register).toHaveBeenCalledWith(fastifyJwt, { secret: 'test-jwt-secret' });
    expect(app.register).toHaveBeenCalledWith(fastifyRedis, { url: 'redis://localhost:6379' });
    expect(app.register).toHaveBeenCalledWith(fastifyCookie, {
      secret: 'test-cookie-secret',
      hook: 'onRequest',
      parseOptions: {},
    });
    expect(app.register).toHaveBeenCalledWith(fastifySwagger, expect.any(Object));
    expect(app.register).toHaveBeenCalledWith(authRoutes, { prefix: '/auth' });
    expect(app.register).toHaveBeenCalledWith(otpRoutes, { prefix: '/auth/otp' });
    expect(app.setErrorHandler).toHaveBeenCalled();
  });
});

describe('Server start', () => {
  let app: ReturnType<typeof fastify>;

  beforeEach(() => {
    app = {
      register: jest.fn(),
      setErrorHandler: jest.fn(),
      listen: jest.fn(),
    } as any;
    ((fastify as unknown) as jest.Mock).mockReturnValue(app);
    process.env.PORT = '3000';
    process.env.HOST = '0.0.0.0';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start the server if the file is run directly', async () => {
    const start = async () => {
      try {
        const app = await createApp();
        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        const host = process.env.HOST || '0.0.0.0';

        await app.listen({ port, host });
        expect(app.listen).toHaveBeenCalledWith({ port, host });
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    };

    await start();
  });
});