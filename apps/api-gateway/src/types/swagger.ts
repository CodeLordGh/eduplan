import { fastifySwaggerUi } from '@fastify/swagger-ui';
import type { SwaggerOptions } from '@fastify/swagger';

export type SwaggerTag = {
  name: string;
  description: string;
};

export type SwaggerSecurity = {
  bearerAuth: string[];
};

export type SwaggerInfo = {
  title: string;
  description: string;
  version: string;
  contact: {
    name: string;
    email: string;
  };
};

export type SwaggerServer = {
  url: string;
  description: string;
};

export type SwaggerConfig = {
  openapi: {
    info: SwaggerInfo;
    servers: SwaggerServer[];
    tags: SwaggerTag[];
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http';
          scheme: 'bearer';
          bearerFormat: 'JWT';
        };
      };
    };
    security: SwaggerSecurity[];
  };
};

export type SwaggerUIConfig = {
  routePrefix: string;
  uiConfig: {
    docExpansion: 'list' | 'full' | 'none';
    deepLinking: boolean;
    persistAuthorization: boolean;
  };
  staticCSP: boolean;
  transformStaticCSP: (header: string) => string;
};