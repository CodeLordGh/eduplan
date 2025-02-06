import Redis from 'ioredis';
import { Logger } from '@eduflow/types';


export interface RedisPoolOptions {
  nodes: Array<{
    host: string;
    port: number;
  }>;
  maxConnections: number;
  minConnections?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
}

export interface RedisPoolState {
  pool: Redis[];
  inUse: Set<Redis>;
  waitingOperations: Array<{
    id: NodeJS.Timeout;
    resolve: (client: Redis) => void;
    reject: (error: Error) => void;
  }>;
}

const createClient = (
  node: { host: string; port: number },
  logger: Logger
): Promise<Redis> =>
  new Promise((resolve, reject) => {
    const client = new Redis({
      host: node.host,
      port: node.port,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    client.on('error', (error) => {
      logger.error('Redis client error', {
        error: error.message,
        host: node.host,
        port: node.port
      });
    });

    client.on('connect', () => {
      logger.info('Redis client connected', {
        host: node.host,
        port: node.port
      });
      resolve(client);
    });

    client.on('close', () => {
      logger.warn('Redis client disconnected', {
        host: node.host,
        port: node.port
      });
    });
  });

const initialize = async (
  options: RedisPoolOptions,
  logger: Logger
): Promise<RedisPoolState> => {
  const minConnections = options.minConnections || 1;
  const state: RedisPoolState = {
    pool: [],
    inUse: new Set(),
    waitingOperations: []
  };

  try {
    for (let i = 0; i < minConnections; i++) {
      const nodeIndex = i % options.nodes.length;
      const client = await createClient(options.nodes[nodeIndex], logger);
      state.pool.push(client);
    }

    logger.info('Redis pool initialized', {
      poolSize: state.pool.length,
      maxConnections: options.maxConnections
    });

    return state;
  } catch (error) {
    logger.error('Failed to initialize Redis pool', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

const acquire = async (
  state: RedisPoolState,
  options: RedisPoolOptions,
  logger: Logger
): Promise<[Redis, RedisPoolState]> => {
  // Check for available connection
  const available = state.pool.find(client => !state.inUse.has(client));
  if (available) {
    state.inUse.add(available);
    return [available, state];
  }

  // Create new connection if possible
  if (state.pool.length + state.inUse.size < options.maxConnections) {
    const nodeIndex = state.pool.length % options.nodes.length;
    const client = await createClient(options.nodes[nodeIndex], logger);
    state.inUse.add(client);
    state.pool.push(client);
    return [client, state];
  }

  // Wait for available connection
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const index = state.waitingOperations.findIndex(
        op => op.id === timeout
      );
      if (index !== -1) {
        state.waitingOperations.splice(index, 1);
      }
      reject(new Error('Timeout waiting for Redis connection'));
    }, options.acquireTimeout || 5000);

    state.waitingOperations.push({
      id: timeout,
      resolve: (client: Redis) => {
        clearTimeout(timeout);
        resolve([client, state]);
      },
      reject: (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
};

const release = (
  client: Redis,
  state: RedisPoolState,
  options: RedisPoolOptions,
  logger: Logger
): RedisPoolState => {
  state.inUse.delete(client);

  // Check if anyone is waiting for a connection
  if (state.waitingOperations.length > 0) {
    const { resolve } = state.waitingOperations.shift()!;
    state.inUse.add(client);
    resolve(client);
    return state;
  }

  // If we have more than minConnections and the client is idle
  if (state.pool.length > (options.minConnections || 1)) {
    const idleTimeout = options.idleTimeout || 30000;
    setTimeout(() => {
      if (!state.inUse.has(client)) {
        const index = state.pool.indexOf(client);
        if (index !== -1) {
          state.pool.splice(index, 1);
          client.disconnect();
          logger.info('Closed idle Redis connection', {
            poolSize: state.pool.length,
            maxConnections: options.maxConnections
          });
        }
      }
    }, idleTimeout);
  }

  return state;
};

export const createRedisPool = (options: RedisPoolOptions, logger: Logger) => {
  let state: RedisPoolState;

  const init = async () => {
    state = await initialize(options, logger);
  };

  const withClient = async <T>(
    operation: (client: Redis) => Promise<T>
  ): Promise<T> => {
    const [client, newState] = await acquire(state, options, logger);
    state = newState;
    
    try {
      return await operation(client);
    } finally {
      state = release(client, state, options, logger);
    }
  };

  const close = async () => {
    await Promise.all([
      ...state.pool.map(client => client.quit()),
      ...Array.from(state.inUse).map(client => client.quit())
    ]);

    state.waitingOperations.forEach(({ reject }) => {
      reject(new Error('Pool is closing'));
    });

    state = {
      pool: [],
      inUse: new Set(),
      waitingOperations: []
    };

    logger.info('Redis pool closed');
  };

  return {
    init,
    withClient,
    close
  };
}; 