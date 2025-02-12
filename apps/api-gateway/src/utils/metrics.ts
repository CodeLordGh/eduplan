import os from 'os';
import { logMetrics } from '../config/logger';

const METRICS_INTERVAL = 60000; // 1 minute
const CPU_THRESHOLD = 80; // 80% CPU usage
const MEMORY_THRESHOLD = 85; // 85% memory usage
const REQUEST_RATE_THRESHOLD = 1000; // 1000 requests per minute

interface SystemMetrics {
  cpu: number;
  memory: number;
  eventQueueSize: number;
  activeConnections: number;
  requestRate: number;
}

interface MetricsState {
  requestCount: number;
  activeConnections: number;
}

const createMetricsState = (): MetricsState => ({
  requestCount: 0,
  activeConnections: 0,
});

const updateMetricsState = (state: MetricsState, update: Partial<MetricsState>): MetricsState => ({
  ...state,
  ...update,
});

const calculateCpuUsage = (): number => {
  const cpus = os.cpus();
  const cpuUsage =
    cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

  return Math.round(cpuUsage * 100) / 100;
};

const calculateMemoryUsage = (): number => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

  return Math.round(memoryUsage * 100) / 100;
};

const collectMetrics = async (state: MetricsState): Promise<SystemMetrics> => ({
  cpu: calculateCpuUsage(),
  memory: calculateMemoryUsage(),
  eventQueueSize: process.listenerCount('beforeExit'),
  activeConnections: state.activeConnections,
  requestRate: state.requestCount,
});

export const createMetricsCollector = () => {
  let state = createMetricsState();

  const incrementRequestCount = () => {
    state = updateMetricsState(state, { requestCount: state.requestCount + 1 });
  };

  const incrementConnections = () => {
    state = updateMetricsState(state, { activeConnections: state.activeConnections + 1 });
  };

  const decrementConnections = () => {
    state = updateMetricsState(state, { activeConnections: state.activeConnections - 1 });
  };

  const startCollection = () => {
    const interval = setInterval(async () => {
      try {
        const metrics = await collectMetrics(state);

        logMetrics({
          metrics,
          thresholds: {
            cpu: CPU_THRESHOLD,
            memory: MEMORY_THRESHOLD,
            requestRate: REQUEST_RATE_THRESHOLD,
          },
        });

        // Reset request count after logging
        state = updateMetricsState(state, { requestCount: 0 });
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, METRICS_INTERVAL);

    // Clean up on process exit
    process.on('SIGTERM', () => clearInterval(interval));
    process.on('SIGINT', () => clearInterval(interval));
  };

  return {
    incrementRequestCount,
    incrementConnections,
    decrementConnections,
    startCollection,
  };
};
