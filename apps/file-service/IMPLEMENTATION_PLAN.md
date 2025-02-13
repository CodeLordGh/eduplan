# File Service Implementation Plan

## Development Standards

- Functional programming only using `fp-ts`
- Maximum 200 lines per file
- CQRS pattern implementation
- Event-driven architecture
- Clean Architecture principles
- TypeScript strict mode enabled

## Directory Structure

```
apps/file-service/
├── src/
│   ├── config/               # Configuration setup
│   │   ├── cloudinary.ts
│   │   ├── redis.ts
│   │   └── swagger.ts
│   ├── commands/            # CQRS Command handlers
│   │   ├── upload-file.ts
│   │   ├── delete-file.ts
│   │   ├── update-access.ts
│   │   └── update-quota.ts
│   ├── queries/             # CQRS Query handlers
│   │   ├── get-file.ts
│   │   ├── list-files.ts
│   │   └── get-quota.ts
│   ├── events/              # Event handlers
│   │   ├── publishers.ts
│   │   └── subscribers.ts
│   ├── repositories/        # Data access layer
│   │   ├── file.repository.ts
│   │   └── quota.repository.ts
│   ├── services/           # Business logic
│   │   ├── storage.service.ts
│   │   ├── quota.service.ts
│   │   └── access.service.ts
│   ├── utils/              # Utility functions
│   │   ├── file-validators.ts
│   │   └── error-handlers.ts
│   ├── routes/             # API routes
│   │   ├── upload.routes.ts
│   │   ├── access.routes.ts
│   │   └── quota.routes.ts
│   └── app.ts              # Application entry point
├── prisma/                 # Prisma schema and migrations
│   └── schema.prisma       # File-related schema only
└── package.json
```

## Dependencies

### From @libs

```typescript
// @libs/common
import { createLogger, createError, type TaskEither } from '@libs/common';

// @libs/types
import { FileType, FileCategory, FileAccessLevel, StorageProvider } from '@libs/types';

// @libs/validators
import { fileSchema, accessSchema, quotaSchema } from '@libs/validators';

// @libs/middleware
import { authenticate, authorize, rateLimit } from '@libs/middleware';

// @libs/constants
import { FILE_TYPES, FILE_MIME_TYPES, FILE_SIZE_LIMITS, ERROR_CODES } from '@libs/constants';
```

### External Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/multipart": "^7.7.3",
    "cloudinary": "^1.41.0",
    "zod": "^3.22.2",
    "@prisma/client": "^5.2.0",
    "fp-ts": "^2.16.1",
    "sharp": "^0.32.5"
  }
}
```

## Implementation Phases

### Phase 1: Core File Operations (Week 1-2)

#### Week 1: Basic Setup and Upload

1. Project Setup

   - Initialize project structure
   - Configure TypeScript and ESLint
   - Set up Prisma with file models
   - Configure Cloudinary integration

2. Core File Upload

   - Implement multipart file upload
   - Add file validation
   - Implement Cloudinary upload
   - Basic error handling

3. File Retrieval
   - Implement file download
   - Secure URL generation
   - Basic file metadata handling

#### Week 2: Storage and Events

1. Storage Management

   - Implement file deletion
   - Add file update functionality
   - Implement temporary file cleanup

2. Event System Integration
   - Set up RabbitMQ connection
   - Implement event publishers
   - Implement event subscribers
   - Add event logging

### Phase 2: Access Control (Week 3-4)

#### Week 3: Permissions and Access

1. Role-Based Access

   - Implement permission checks
   - Add role validation
   - Set up access levels

2. File Sharing
   - Implement share link generation
   - Add share link validation
   - Implement share expiration

#### Week 4: Quota and History

1. Quota Management

   - Implement quota tracking
   - Add quota validation
   - Set up quota alerts

2. File History
   - Implement file version tracking
   - Add audit logging
   - Implement history cleanup

### Phase 3: Educational Features (Week 5-6)

#### Week 5: Resource Management

1. Educational Resources

   - Add resource categorization
   - Implement tagging system
   - Add metadata enrichment

2. AI Integration
   - Handle AI-generated content
   - Implement content validation
   - Add content processing

#### Week 6: Assignment Integration

1. Assignment Handling

   - Implement assignment file linking
   - Add submission handling
   - Implement file organization

2. Quiz Integration
   - Add quiz file support
   - Implement resource linking
   - Add access controls

### Phase 4: Optimization (Week 7-8)

#### Week 7: Caching and Performance

1. Redis Integration

   - Set up Redis caching
   - Implement cache strategies
   - Add cache invalidation

2. Performance Optimization
   - Add file compression
   - Implement lazy loading
   - Add batch operations

#### Week 8: Monitoring and CDN

1. CDN Integration

   - Set up CDN configuration
   - Implement URL generation
   - Add cache headers

2. Monitoring Setup
   - Add performance metrics
   - Implement health checks
   - Set up alerting

## Event System

### Events Published

```typescript
type FileEvents = {
  FILE_UPLOADED: {
    fileId: string;
    ownerId: string;
    type: FileType;
    category: FileCategory;
    size: number;
    cloudinaryId: string;
    cloudinaryUrl: string;
    metadata: Record<string, unknown>;
  };
  FILE_DELETED: {
    fileId: string;
    ownerId: string;
    type: FileType;
    usageContext: string[];
  };
  FILE_ACCESS_GRANTED: {
    fileId: string;
    userId: string;
    level: FileAccessLevel;
  };
  FILE_ACCESS_REVOKED: {
    fileId: string;
    userId: string;
    reason: string;
  };
  QUOTA_EXCEEDED: {
    userId: string;
    schoolId?: string;
    currentUsage: number;
    limit: number;
  };
  FILE_PROCESSED: {
    fileId: string;
    cloudinaryId: string;
    cloudinaryUrl: string;
    thumbnailUrl?: string;
  };
};
```

### Events Consumed

```typescript
type ConsumedEvents = {
  USER_DELETED: {
    userId: string;
  };
  SCHOOL_CREATED: {
    schoolId: string;
    ownerId: string;
    documents: {
      type: FileType;
      required: boolean;
      metadata: Record<string, unknown>;
    }[];
  };
  KYC_SUBMITTED: {
    userId: string;
    documents: {
      type: DocumentType;
      metadata: Record<string, unknown>;
    }[];
  };
  ASSIGNMENT_CREATED: {
    assignmentId: string;
    teacherId: string;
    attachments: {
      type: FileType;
      metadata: Record<string, unknown>;
    }[];
  };
  QUIZ_CREATED: {
    quizId: string;
    teacherId: string;
    attachments: {
      type: FileType;
      metadata: Record<string, unknown>;
    }[];
  };
  AI_CONTENT_GENERATED: {
    contentId: string;
    type: FileType;
    metadata: Record<string, unknown>;
  };
};
```

## API Routes

### File Management

```typescript
// POST /files/upload
fastify.post('/files/upload', {
  handler: uploadFileHandler,
  schema: uploadFileSchema,
});

// GET /files/:fileId
fastify.get('/files/:fileId', {
  handler: getFileHandler,
  schema: getFileSchema,
});

// DELETE /files/:fileId
fastify.delete('/files/:fileId', {
  handler: deleteFileHandler,
  schema: deleteFileSchema,
});
```

### Access Control

```typescript
// POST /files/:fileId/access
fastify.post('/files/:fileId/access', {
  handler: grantAccessHandler,
  schema: grantAccessSchema,
});

// DELETE /files/:fileId/access/:userId
fastify.delete('/files/:fileId/access/:userId', {
  handler: revokeAccessHandler,
  schema: revokeAccessSchema,
});
```

### Quota Management

```typescript
// GET /quotas/:userId
fastify.get('/quotas/:userId', {
  handler: getQuotaHandler,
  schema: getQuotaSchema,
});

// PUT /quotas/:userId
fastify.put('/quotas/:userId', {
  handler: updateQuotaHandler,
  schema: updateQuotaSchema,
});
```

## API Documentation

### OpenAPI/Swagger Configuration

```typescript
// Configuration (src/config/swagger.ts)
const swaggerConfig = {
  routePrefix: '/documentation',
  openapi: {
    info: {
      title: 'File Service API',
      description: 'API for managing file uploads, downloads, and access control',
      version: '1.0.0',
    },
    tags: [
      { name: 'files', description: 'File management endpoints' },
      { name: 'access', description: 'File access control endpoints' },
      { name: 'quotas', description: 'Quota management endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  exposeRoute: true,
};

// Schema Definitions
const fileSchemas = {
  File: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      type: { type: 'string', enum: Object.values(FileType) },
      category: { type: 'string', enum: Object.values(FileCategory) },
      size: { type: 'number' },
      cloudinaryUrl: { type: 'string', format: 'uri' },
      accessLevel: { type: 'string', enum: Object.values(FileAccessLevel) },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  FileUploadRequest: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
      type: { type: 'string', enum: Object.values(FileType) },
      category: { type: 'string', enum: Object.values(FileCategory) },
      accessLevel: { type: 'string', enum: Object.values(FileAccessLevel) },
    },
    required: ['file', 'type', 'category', 'accessLevel'],
  },
};

// Route Documentation
const routeDocumentation = {
  '/files/upload': {
    post: {
      tags: ['files'],
      summary: 'Upload a new file',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/FileUploadRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'File uploaded successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/File' },
            },
          },
        },
        '400': { description: 'Invalid request' },
        '401': { description: 'Unauthorized' },
        '413': { description: 'File too large' },
      },
    },
  },
};
```

### API Documentation Structure

```
/api/v1/files/documentation
├── File Management
│   ├── POST /upload - Upload new file
│   ├── GET /:fileId - Get file details
│   └── DELETE /:fileId - Delete file
├── Access Control
│   ├── POST /:fileId/access - Grant access
│   └── DELETE /:fileId/access/:userId - Revoke access
└── Quota Management
    ├── GET /quotas/:userId - Get quota info
    └── PUT /quotas/:userId - Update quota
```

### Documentation Integration

1. Schema Definitions

   - File schemas
   - Request/Response schemas
   - Error schemas
   - Validation schemas

2. Route Documentation

   - Endpoint descriptions
   - Request/Response examples
   - Security requirements
   - Error responses

3. API Gateway Integration
   - Documentation endpoint exposure
   - Schema sharing
   - Security definitions
   - Response standardization

## Testing Strategy

### Unit Tests

- Command handlers
- Query handlers
- Service methods
- Utility functions
- Validation logic

### Integration Tests

- API endpoints
- Event handlers
- Storage operations
- Access control
- Quota management

### E2E Tests

- File upload flow
- File sharing flow
- Quota enforcement
- Event processing

## Monitoring

### Metrics

- Upload/download rates
- Storage usage
- Access patterns
- Cache hit rates
- Error rates
- Processing times

### Logging

- File operations
- Access attempts
- Quota updates
- Event processing
- Error tracking

## Security Measures

1. File validation
2. Access control
3. Quota enforcement
4. URL signing
5. Rate limiting
6. Audit logging
7. Content validation
8. Metadata sanitization
