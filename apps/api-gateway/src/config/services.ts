import { ProxyConfig } from '../types/proxy';

export const serviceConfig: ProxyConfig = {
  services: [
    {
      name: 'auth-service',
      prefix: '/auth',
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000 // 30 seconds
      }
    },
    {
      name: 'user-service',
      prefix: '/users',
      target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    },
    {
      name: 'kyc-service',
      prefix: '/kyc',
      target: process.env.KYC_SERVICE_URL || 'http://localhost:3003',
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    }
  ]
};