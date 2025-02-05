import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../config/logger';

export interface VersionConfig {
  defaultVersion: string;
  supportedVersions: string[];
  deprecatedVersions: string[];
  versionExtractor: (request: FastifyRequest) => string;
}

export interface VersionManager {
  middleware: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  isSupported: (version: string) => boolean;
  isDeprecated: (version: string) => boolean;
  getCurrentVersion: () => string;
  getSupportedVersions: () => string[];
  getDeprecatedVersions: () => string[];
}

export const createVersionManager = (config: VersionConfig): VersionManager => {
  const {
    defaultVersion,
    supportedVersions,
    deprecatedVersions,
    versionExtractor
  } = config;

  const isSupported = (version: string) => supportedVersions.includes(version);
  const isDeprecated = (version: string) => deprecatedVersions.includes(version);

  const middleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const version = versionExtractor(request);
    
    // Attach version to request for handlers
    request.apiVersion = version || defaultVersion;

    // Add version headers
    reply.header('api-version', version);
    reply.header('api-supported-versions', supportedVersions.join(', '));

    // Handle deprecated versions
    if (isDeprecated(version)) {
      reply.header('api-deprecated', 'true');
      reply.header('sunset', '2024-12-31'); // Configure based on your deprecation policy
      
      logger.warn('Deprecated API version used', {
        version,
        path: request.url,
        method: request.method,
        requestId: request.id
      });
    }

    // Handle unsupported versions
    if (!isSupported(version) && version !== defaultVersion) {
      logger.error('Unsupported API version requested', {
        version,
        path: request.url,
        method: request.method,
        requestId: request.id
      });

      reply.code(400).send({
        error: 'Unsupported API version',
        supportedVersions,
        requestedVersion: version
      });
      return;
    }
  };

  return {
    middleware,
    isSupported,
    isDeprecated,
    getCurrentVersion: () => defaultVersion,
    getSupportedVersions: () => supportedVersions,
    getDeprecatedVersions: () => deprecatedVersions
  };
}; 