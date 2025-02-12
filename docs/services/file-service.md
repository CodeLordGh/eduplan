# File Service Development Plan

## Service Overview

The File Service manages file uploads, downloads, storage, and access control across the platform. It handles various file types including documents, images, assignments, and educational resources.

## Dependencies

### Shared Libraries

```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, FileUtils } from '@eduflow/common';

// From @eduflow/types
import { File, FileType, FileAccess, StorageProvider } from '@eduflow/types';

// From @eduflow/validators
import { validateFile, validateAccess } from '@eduflow/validators';

// From @eduflow/middleware
import { authGuard, roleGuard, fileGuard } from '@eduflow/middleware';

// From @eduflow/constants
import { FILE_TYPES, MIME_TYPES, ACCESS_LEVELS } from '@eduflow/constants';
```

### External Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/swagger": "^8.8.0",
    "@fastify/multipart": "^7.7.3",
    "zod": "^3.22.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0",
    "@aws-sdk/client-s3": "^3.405.0",
    "@google-cloud/storage": "^7.0.1",
    "sharp": "^0.32.5",
    "mime-types": "^2.1.35",
    "file-type": "^18.5.0",
    "virus-scanner": "^1.1.1",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "prisma": "^5.2.0",
    "jest": "^29.6.4",
    "typescript": "^5.2.2"
  }
}
```

## Database Schema (Prisma)

```prisma
model File {
  id            String       @id @default(uuid())
  ownerId       String
  name          String
  type          FileType
  mimeType      String
  size          Int
  path          String
  provider      StorageProvider
  accessLevel   FileAccess
  metadata      Json?
  checksum      String?
  virusScan     ScanStatus?
  thumbnailPath String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([ownerId])
  @@map("files")
}

model FileAccess {
  id        String   @id @default(uuid())
  fileId    String
  userId    String
  level     AccessLevel
  expiresAt DateTime?
  metadata  Json?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([fileId, userId])
  @@map("file_access")
}

model FileVersion {
  id        String   @id @default(uuid())
  fileId    String
  version   Int
  path      String
  size      Int
  metadata  Json?
  createdAt DateTime @default(now())

  @@unique([fileId, version])
  @@map("file_versions")
}

model FileShare {
  id        String    @id @default(uuid())
  fileId    String
  token     String    @unique
  expiresAt DateTime?
  metadata  Json?
  createdAt DateTime  @default(now())

  @@map("file_shares")
}

model FileQuota {
  id        String   @id @default(uuid())
  userId    String   @unique
  used      BigInt
  limit     BigInt
  metadata  Json?
  updatedAt DateTime @updatedAt

  @@map("file_quotas")
}
```

## Event System

### Events Published

```typescript
type FileEvents = {
  FILE_UPLOADED: {
    fileId: string;
    ownerId: string;
    type: FileType;
    size: number;
    timestamp: Date;
  };
  FILE_DELETED: {
    fileId: string;
    ownerId: string;
    timestamp: Date;
  };
  FILE_SHARED: {
    fileId: string;
    shareId: string;
    expiresAt?: Date;
    timestamp: Date;
  };
  FILE_ACCESS_GRANTED: {
    fileId: string;
    userId: string;
    level: AccessLevel;
    timestamp: Date;
  };
  QUOTA_EXCEEDED: {
    userId: string;
    currentUsage: number;
    limit: number;
    timestamp: Date;
  };
};
```

### Events Consumed

```typescript
type ConsumedEvents = {
  USER_DELETED: {
    userId: string;
  };
  ASSIGNMENT_CREATED: {
    assignmentId: string;
    attachments: object[];
  };
  SCHOOL_CREATED: {
    schoolId: string;
    documents: object[];
  };
  KYC_SUBMITTED: {
    userId: string;
    documents: object[];
  };
};
```

## API Endpoints

### File Management

```typescript
// POST /files/upload
type UploadFileRequest = {
  file: File;
  type: FileType;
  accessLevel: FileAccess;
  metadata?: Record<string, unknown>;
};

// GET /files/:fileId
type GetFileResponse = {
  file: File;
  downloadUrl: string;
  thumbnail?: string;
};

// POST /files/:fileId/share
type ShareFileRequest = {
  expiresIn?: number; // seconds
  accessLevel: FileAccess;
  metadata?: Record<string, unknown>;
};
```

### Access Control

```typescript
// POST /files/:fileId/access
type GrantAccessRequest = {
  userId: string;
  level: AccessLevel;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
};

// GET /files/:fileId/access
type GetAccessResponse = {
  accesses: FileAccess[];
};
```

### Quota Management

```typescript
// GET /quotas/:userId
type GetQuotaResponse = {
  used: number;
  limit: number;
  remaining: number;
};

// PUT /quotas/:userId
type UpdateQuotaRequest = {
  limit: number;
  metadata?: Record<string, unknown>;
};
```

## Implementation Plan

### Phase 1: Core File Operations

1. Upload/download system
2. Storage provider integration
3. File type validation
4. Virus scanning

### Phase 2: Access Control

1. Permission system
2. Sharing mechanism
3. Access tracking
4. Quota management

### Phase 3: Advanced Features

1. File versioning
2. Thumbnail generation
3. File compression
4. Metadata extraction

### Phase 4: Optimization

1. Caching system
2. CDN integration
3. Batch operations
4. Storage optimization

## Testing Strategy

### Unit Tests

```typescript
// File service tests
describe('FileService', () => {
  test('should upload files');
  test('should validate file types');
  test('should manage access');
});

// Storage service tests
describe('StorageService', () => {
  test('should store files');
  test('should generate urls');
  test('should handle versioning');
});
```

### Integration Tests

```typescript
describe('File API', () => {
  test('should handle file uploads');
  test('should manage permissions');
  test('should track quotas');
  test('should integrate with storage');
});
```

## Monitoring & Logging

### Metrics

- Upload/download rates
- Storage usage
- Access patterns
- Error rates
- Processing times

### Logging

```typescript
const logger = createLogger({
  service: 'file-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION,
  },
});
```

## Security Measures

1. File type validation
2. Virus scanning
3. Access control
4. Encryption at rest
5. Secure URL generation
