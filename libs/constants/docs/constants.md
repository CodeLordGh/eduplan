# Constants Library Documentation

This document provides a comprehensive overview of all constants exported from the constants library.

## Table of Contents
- [HTTP Status Constants](#http-status-constants)
- [Error Codes](#error-codes)
- [Academic Constants](#academic-constants)

## HTTP Status Constants

Exported from `src/http-status.ts`, these constants provide standard HTTP status codes used throughout the application.

### Exports
- `HTTP_STATUS`: Object containing HTTP status codes
- `HttpStatus`: TypeScript type representing valid status code values (union type of all status codes)

### Usage Example
```typescript
import { HTTP_STATUS, HttpStatus } from '@eduflow/constants';

// Using status codes
response.status(HTTP_STATUS.OK).send(data);
response.status(HTTP_STATUS.NOT_FOUND).send({ error: 'Resource not found' });

// Type-safe status code usage
function handleResponse(status: HttpStatus) {
  if (status === HTTP_STATUS.OK) {
    // Handle success
  }
}
```

### Status Code Groups

#### Success Responses (2xx)
- `OK`: 200
- `CREATED`: 201
- `ACCEPTED`: 202
- `NO_CONTENT`: 204

#### Redirections (3xx)
- `MOVED_PERMANENTLY`: 301
- `FOUND`: 302
- `TEMPORARY_REDIRECT`: 307
- `PERMANENT_REDIRECT`: 308

#### Client Errors (4xx)
- `BAD_REQUEST`: 400
- `UNAUTHORIZED`: 401
- `FORBIDDEN`: 403
- `NOT_FOUND`: 404
- `METHOD_NOT_ALLOWED`: 405
- `NOT_ACCEPTABLE`: 406
- `CONFLICT`: 409
- `GONE`: 410
- `UNPROCESSABLE_ENTITY`: 422
- `TOO_MANY_REQUESTS`: 429

#### Server Errors (5xx)
- `INTERNAL_SERVER_ERROR`: 500
- `NOT_IMPLEMENTED`: 501
- `BAD_GATEWAY`: 502
- `SERVICE_UNAVAILABLE`: 503
- `GATEWAY_TIMEOUT`: 504

## Error Codes

Exported from `src/error-codes.ts`, these constants define application-specific error codes.

### Exports
- `ERROR_CODES`: Object containing all error code constants
- `ErrorCode`: TypeScript type for type-safe error code usage (union type of all error codes)

### Usage Example
```typescript
import { ERROR_CODES, ErrorCode } from '@eduflow/constants';

// Using error codes
throw createError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);

// Type-safe error handling
function handleError(code: ErrorCode) {
  switch (code) {
    case ERROR_CODES.AUTH_ERROR:
      return 'Authentication failed';
    case ERROR_CODES.VALIDATION_ERROR:
      return 'Validation failed';
    // ...
  }
}
```

### Error Categories

#### Authentication Errors
- `AUTH_ERROR`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `INVALID_TOKEN`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `USER_NOT_FOUND`
- `DUPLICATE_EMAIL`
- `USER_INACTIVE`
- `USER_BLOCKED`

#### OTP Errors
- `OTP_ERROR`
- `OTP_EXPIRED`
- `INVALID_OTP`
- `OTP_LIMIT_EXCEEDED`

#### Validation Errors
- `VALIDATION_ERROR`
- `INVALID_INPUT`
- `REQUIRED_FIELD`
- `INVALID_FORMAT`

#### Database Errors
- `DATABASE_ERROR`
- `CONNECTION_ERROR`
- `QUERY_ERROR`
- `RECORD_NOT_FOUND`
- `DUPLICATE_RECORD`

#### Event Errors
- `EVENT_ERROR`
- `EVENT_PUBLISH_ERROR`
- `EVENT_CONSUME_ERROR`

#### Service Errors
- `SERVICE_ERROR`
- `SERVICE_UNAVAILABLE`
- `EXTERNAL_SERVICE_ERROR`

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED`

#### File Errors
- `FILE_ERROR`
- `FILE_NOT_FOUND`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`

#### Network Errors
- `NETWORK_ERROR`
- `REQUEST_TIMEOUT`

#### Email Errors
- `EMAIL_ERROR`
- `EMAIL_SEND_FAILED`
- `EMAIL_TEMPLATE_ERROR`

#### System Errors
- `SYSTEM_ERROR`
- `UNKNOWN_ERROR`

## Academic Constants

Exported from `src/academic.ts`, these constants define academic-related configurations and events.

### Exports

#### Report Card Delay
- `REPORT_CARD_AVAILABILITY_DELAY_HOURS`: 72 (hours)

#### Grade Scales
`GRADE_SCALES` object containing:

##### Percentage Scale
- Min: 0
- Max: 100
- Passing: 50

##### GPA Scale
- Min: 0
- Max: 4
- Passing: 2

##### Letter Grade Scale
- Values: ['A+', 'A', 'B', 'C', 'D', 'F']
- Passing: 'D'

#### Academic Permissions
`ACADEMIC_PERMISSIONS` object containing:
- `VIEW_REPORT_CARD`: 'academic:report-card:view'
- `DOWNLOAD_REPORT_CARD`: 'academic:report-card:download'
- `PRINT_REPORT_CARD`: 'academic:report-card:print'
- `RECORD_GRADES`: 'academic:grades:record'
- `APPROVE_GRADES`: 'academic:grades:approve'
- `MANAGE_TEMPLATES`: 'academic:templates:manage'

#### Report Card Events
`REPORT_CARD_EVENTS` object containing:
- `PUBLISHED`: 'REPORT_CARD_PUBLISHED'
- `AVAILABLE`: 'REPORT_CARD_AVAILABLE'
- `ACCESSED`: 'REPORT_CARD_ACCESSED'
- `STATUS_UPDATED`: 'REPORT_CARD_STATUS_UPDATED'

#### Grade Events
`GRADE_EVENTS` object containing:
- `RECORDED`: 'GRADE_RECORDED'
- `MISSING`: 'MISSING_GRADES_ALERT'

### Usage Example
```typescript
import { 
  GRADE_SCALES, 
  ACADEMIC_PERMISSIONS,
  REPORT_CARD_EVENTS,
  GRADE_EVENTS,
  REPORT_CARD_AVAILABILITY_DELAY_HOURS 
} from '@eduflow/constants';

// Using grade scales
const isPassingGrade = (grade: number) => 
  grade >= GRADE_SCALES.PERCENTAGE.passing;

// Using permissions
if (hasPermission(ACADEMIC_PERMISSIONS.RECORD_GRADES)) {
  // Allow grade recording
}

// Using events
eventBus.emit(REPORT_CARD_EVENTS.PUBLISHED, {
  studentId,
  reportCardId
});

// Using delay constant
const availableAt = new Date(
  publishedAt.getTime() + 
  REPORT_CARD_AVAILABILITY_DELAY_HOURS * 60 * 60 * 1000
);
```
