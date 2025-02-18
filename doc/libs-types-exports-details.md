# Detailed Exports from libs/types

## [auth/index.ts](../libs/types/src/auth/index.ts)

- **Roles and Permission Types**: Re-exports from `roles` and `status`.
- **Event Types and Schemas**: Re-exports from `events`.
- **Constants and Configuration**: Re-exports from `constants`.
- **Access Control Types**: Includes `AccessPolicy`, `ValidationResult`, `PolicyConditions`, `ResourceAction`, `SchoolRole`, `KYCOfficerStatus`, `UserKYC`, `UserEmployment`, `TimeRestrictions`, `UserAccess`, `UserAttributes`, `ExtendedRole` from `abac`.
- **User Management Types**: Re-exports from `user`.
- **Validation Types**: Includes `Email`, `Password`, `LoginCredentials`, `Registration` from `validation`.

## [kyc/types.ts](../libs/types/src/kyc/types.ts)

- **DocumentType**: Enum with values `IDENTITY`, `SCHOOL_LICENSE`, `EMPLOYMENT_PROOF`, `QUALIFICATION`.
- **VerificationStatus**: Enum with values `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`.
- **KYCDocument**: Interface with fields `id`, `userId`, `type`, `status`, `documentUrls`, `verifiedAt`, `metadata`, `createdAt`, `updatedAt`.
- **VerificationHistory**: Interface with fields `id`, `entityId`, `entityType`, `status`, `verifiedBy`, `notes`, `createdAt`, `updatedAt`.
- **KYCVerificationEvent**: Interface with fields `userId`, `documentId`, `status`, `type`, `verifiedBy`, `timestamp`.

## [academic/report-card.ts](../libs/types/src/academic/report-card.ts)

- **ReportCardStatus**: Enum with values `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `PUBLISHED`, `AVAILABLE`.
- **GradeStatus**: Enum with values `DRAFT`, `SUBMITTED`, `APPROVED`.
- **Grade**: Interface with fields `subjectId`, `subjectName`, `teacherId`, `teacherName`, `grade`, `remarks`, `status`.
- **Attendance**: Interface with fields `present`, `absent`, `late`, `totalDays`.
- **ReportCardRemarks**: Interface with fields `teacher`, `headmaster`, `parent`.
- **ReportCard**: Interface with fields `id`, `schoolId`, `studentId`, `termId`, `academicYearId`, `grades`, `attendance`, `remarks`, `status`, `publishedAt`, `availableAt`, `metadata`, `createdAt`, `updatedAt`.
- **ReportCardAccess**: Interface with fields `reportCardId`, `userId`, `accessType`, `grantedAt`, `expiresAt`, `metadata`.
- **ReportCardTemplate**: Interface with fields `id`, `schoolId`, `name`, `template`, `header`, `footer`, `logo`, `metadata`, `createdAt`, `updatedAt`.

## [database/index.ts](../libs/types/src/database/index.ts)

- **PrismaClient**: Type alias for `BasePrismaClient`.
- **Profile**: Type alias for `PrismaProfile`.

## [file/types.ts](../libs/types/src/file/types.ts)

- **FileType, FileCategory, FileAccessLevel, StorageProvider**: Re-exported from `@eduflow/prisma`.
- **FileMetadata**: Interface with fields `size`, `mimeType`, `originalName`, `encoding`, and additional fields.
- **FileUploadResult**: Interface with fields `id`, `url`, `type`, `category`, `metadata`, `createdAt`.

## [errors/index.ts](../libs/types/src/errors/index.ts)

- **ErrorCategory, ErrorCodeMap, ErrorCode, ValidationErrorMetadata, FileErrorMetadata, AuthErrorMetadata, SystemErrorMetadata, ErrorMetadata, ErrorDetails, AppError, ErrorResponse**: Re-exported from `types`.
- **errorUtils, HTTP_STATUS_CODES**: Re-exported from `utils`.

## [errors/types.ts](../libs/types/src/errors/types.ts)

- **ErrorCategory**: Type with values `AUTH`, `RESOURCE`, `VALIDATION`, `FILE`, `SYSTEM`.
- **ErrorCodeMap**: Type mapping categories to error codes.
- **ErrorCode**: Type for all possible error codes.
- **ValidationErrorMetadata**: Interface with fields `field`, `value`, `constraint`, `additionalFields`.
- **FileErrorMetadata**: Interface with fields `filename`, `size`, `type`, `path`, `quota`.
- **AuthErrorMetadata**: Interface with fields `userId`, `requiredRoles`, `actualRoles`, `tokenExpiry`.
- **SystemErrorMetadata**: Interface with fields `service`, `operation`, `timestamp`, `requestId`.
- **ErrorMetadata**: Type mapping error codes to metadata types.
- **ErrorDetails**: Interface with fields `code`, `message`, `cause`, `metadata`.
- **AppError**: Interface with fields `name`, `message`, `statusCode`, `code`, `cause`, `metadata`.
- **ErrorResponse**: Interface with field `error`.

## [user/types.ts](../libs/types/src/user/types.ts)

- **Subscription**: Interface with fields `schoolId`, `status`.
- **UserAttributes**: Interface with optional field `subscriptions`.

## [auth/events.ts](../libs/types/src/auth/events.ts)

- **AuthEventType**: Enum with values `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `LOGIN_ATTEMPTED`, `OTP_GENERATED`, `KYC_VERIFIED`, `EMPLOYMENT_ELIGIBILITY_UPDATED`.
- **authEventSchemas**: Object mapping `AuthEventType` to Zod schemas.
- **AuthEventDataMap**: Type mapping `AuthEventType` to inferred data types from `authEventSchemas`.
- **UserCreatedEvent**: Interface with fields `type`, `data`.
- **KYCVerifiedEvent**: Interface with fields `type`, `data`.
- **EmploymentEligibilityUpdatedEvent**: Interface with fields `type`, `data`.
- **AuthEvent**: Union type of `UserCreatedEvent`, `KYCVerifiedEvent`, `EmploymentEligibilityUpdatedEvent`.

## [auth/abac.ts](../libs/types/src/auth/abac.ts)

- **ResourceAction**: Type with values `CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `PROCESS`.
- **SchoolRole**: Interface with fields `roles`, `permissions`, `communicationPermissions`, `assignedBy`, `createdAt`.
- **KYCOfficerStatus**: Interface with fields `isOfficer`, `permissions`, `assignedBy`, `assignedAt`.
- **UserKYC**: Interface with fields `status`, `verifiedAt`, `documentIds`, `officerStatus`.
- **UserEmployment**: Interface with fields `status`, `verifiedAt`, `documentIds`, `currentSchools`.
- **TimeRestrictions**: Interface with fields `allowedDays`, `allowedHours`, `timezone`.
- **UserAccess**: Interface with fields `socialEnabled`, `mfaEnabled`, `mfaVerified`, `lastPasswordChange`, `passwordExpiresAt`, `ipRestrictions`, `deviceRestrictions`.
- **UserContext**: Interface with fields `currentSchoolId`, `location`, `deviceInfo`.
- **UserAttributes**: Interface with fields `id`, `email`, `status`, `globalRoles`, `schoolRoles`, `academicProfile`, `kyc`, `employment`, `access`, `context`, `subscriptions`.
- **PolicyConditions**: Interface with fields `anyOf`, `allOf`, `school`, `academic`, `environment`, `verification`, `custom`.
- **AccessPolicy**: Interface with fields `resource`, `action`, `conditions`.
- **ValidationResult**: Interface with fields `granted`, `reason`.
- **IPRestrictions**: Interface with fields `allowlist`, `denylist`.
- **LocationRestrictions**: Interface with fields `countries`, `regions`.
- **DeviceRestrictions**: Interface with fields `requireTrusted`, `minTrustScore`, `allowedTypes`.
- **SchoolConditions**: Interface with fields `mustBeInSchool`, `mustBeOwner`, `mustBeCurrentSchool`, `allowedRoles`.
- **EnvironmentConditions**: Interface with fields `timeRestrictions`, `ipRestrictions`, `locationRestrictions`, `deviceRestrictions`.
- **VerificationConditions**: Interface with fields `requireKYC`, `kycStatus`, `employmentStatus`, `officerPermissions`.
- **CustomEvaluator**: Interface with fields `evaluator`, `errorMessage`.
- **Subscription**: Interface with fields `schoolId`, `status`.

## [auth/roles.ts](../libs/types/src/auth/roles.ts)

- **Role**: Re-exported from `@eduflow/prisma`.
- **Permission**: Enum with various permissions like `MANAGE_SYSTEM`, `VIEW_SYSTEM_LOGS`, etc.
- **ROLE_HIERARCHY**: Record mapping roles to their hierarchy.
- **ROLE_PERMISSIONS**: Record mapping roles to their permissions.
- **UserRole**: Type alias for `Role`.
- **AcademicContext**: Interface with fields `subjects`, `grades`, `departments`, `programs`.
- **ContextualPermissions**: Interface extending `AcademicContext` with `customPermissions`.
- **ExtendedRole**: Interface with fields `baseRole`, `academicRoles`, `contextualPermissions`, `assignedAt`, `assignedBy`, `validUntil`.
- **DEFAULT_ACADEMIC_ROLES**: Partial record mapping roles to default academic roles.

## [auth/validation.ts](../libs/types/src/auth/validation.ts)

- **emailSchema**: Zod schema for email validation.
- **passwordSchema**: Zod schema for password validation.
- **validateEmail**: Function to validate email.
- **validatePassword**: Function to validate password.
- **Email**: Type inferred from `stringSchema.email`.
- **Password**: Type inferred from `passwordSchema`.
- **loginCredentialsSchema**: Zod schema for login credentials.
- **registrationSchema**: Zod schema for registration.
- **validateEmailWithSchema**: Function to validate email with schema.
- **validatePasswordWithSchema**: Function to validate password with schema.
- **validateLoginCredentials**: Function to validate login credentials.
- **validateRegistration**: Function to validate registration.
- **LoginCredentials**: Type inferred from `loginCredentialsSchema`.
- **Registration**: Type inferred from `registrationSchema`.

## [auth/status.ts](../libs/types/src/auth/status.ts)

- **UserStatus**: Enum with values `ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`, `DELETED`.
- **OTPStatus**: Enum with values `PENDING`, `USED`, `EXPIRED`.
- **OTPPurpose**: Enum with values `REGISTRATION`, `PASSWORD_RESET`, `EMAIL_VERIFICATION`, `STAFF_ONBOARDING`, `STUDENT_LINKING`.
- **KYCStatus**: Enum with values `NOT_STARTED`, `IN_PROGRESS`, `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `EXPIRED`.
- **EmploymentEligibilityStatus**: Enum with values `UNVERIFIED`, `PENDING`, `ELIGIBLE`, `INELIGIBLE`, `SUSPENDED`.

## [auth/schema.ts](../libs/types/src/auth/schema.ts)

- **userSchema**: Zod schema for user data structure.
- **createUserSchema**: Zod schema for user creation.
- **updateUserSchema**: Zod schema for user updates.
- **User**: Type inferred from `userSchema`.
- **CreateUserInput**: Type inferred from `createUserSchema`.
- **UpdateUserInput**: Type inferred from `updateUserSchema`.

## [auth/constants.ts](../libs/types/src/auth/constants.ts)

- **AuthStatus**: Enum with values `ACTIVE`, `INACTIVE`, `PENDING`, `BLOCKED`.
- **AUTH_EVENTS**: Object with event constants like `LOGIN`, `LOGOUT`, `REGISTER`, `PASSWORD_RESET`.

## [auth/abac-evaluator.ts](../libs/types/src/auth/abac-evaluator.ts)

- **collectUserAttributes**: Function to collect user attributes for access evaluation.
- **checkRoleHierarchy**: Function to check if user roles satisfy required roles.
- **checkPermissions**: Function to verify if user has required permissions.
- **isWithinAllowedTime**: Function to validate time restrictions.
- **isIPAllowed**: Function to check IP allowlist/denylist.
- **isTrustedDevice**: Function to verify device trust.
- **validateContext**: Function to validate user context against policy conditions.
- **checkEnvironment**: Function to check environmental conditions.
- **checkVerification**: Function to verify user's KYC and employment status.
- **evaluateAccess**: Main ABAC evaluation function.

## [auth/user.ts](../libs/types/src/auth/user.ts)

- **User**: Interface with fields `id`, `email`, `password`, `role`, `status`, `kycStatus`, `kycVerifiedAt`, `kycDocumentIds`, `employmentStatus`, `employmentVerifiedAt`, `employmentDocumentIds`, `socialAccessEnabled`, `createdAt`, `updatedAt`.

## [kyc/events.ts](../libs/types/src/kyc/events.ts)

- **KYCEventType**: Enum with values `KYC_VERIFIED`, `KYC_REJECTED`, `EMPLOYMENT_ELIGIBILITY_UPDATED`.
- **kycEventSchemas**: Object mapping `KYCEventType` to Zod schemas.
- **KYCEventDataMap**: Type mapping `KYCEventType` to inferred data types from `kycEventSchemas`.

## [academic/validation.ts](../libs/types/src/academic/validation.ts)

- **gradeSchema**: Zod schema for grade validation.
- **attendanceSchema**: Zod schema for attendance validation.
- **reportCardRemarksSchema**: Zod schema for report card remarks.
- **reportCardSchema**: Zod schema for report card.
- **reportCardAccessSchema**: Zod schema for report card access.
- **reportCardTemplateSchema**: Zod schema for report card template.
- **validateGrade**: Function to validate grade.
- **validateAttendance**: Function to validate attendance.
- **validateReportCard**: Function to validate report card.
- **Grade**: Type inferred from `gradeSchema`.
- **Attendance**: Type inferred from `attendanceSchema`.
- **ReportCardRemarks**: Type inferred from `reportCardRemarksSchema`.
- **ReportCard**: Type inferred from `reportCardSchema`.
- **ReportCardAccess**: Type inferred from `reportCardAccessSchema`.
- **ReportCardTemplate**: Type inferred from `reportCardTemplateSchema`.

## [academic/index.ts](../libs/types/src/academic/index.ts)

- Re-exports from `constants` and `validation`.
- **Grade, Attendance, ReportCardRemarks, ReportCard, ReportCardAccess, ReportCardTemplate**: Re-exported from `validation`.

## [academic/constants.ts](../libs/types/src/academic/constants.ts)

- **ReportCardStatus**: Enum with values `DRAFT`, `PUBLISHED`, `AVAILABLE`.
- **GradeStatus**: Enum with values `DRAFT`, `PUBLISHED`.

## [events/types.ts](../libs/types/src/events/types.ts)

- **EventType**: Combined enum of `AuthEventType` and `KYCEventType`.
- **EventDataMap**: Combined type of `AuthEventDataMap` and `KYCEventDataMap`.
- **Event**: Interface with fields `type`, `data`, `metadata`.
- **TypedEvent**: Type helper for creating specific event types.
- **AuthEventType, AuthEventDataMap, KYCEventType, KYCEventDataMap**: Re-exported for convenience.

## [events/validation.ts](../libs/types/src/events/validation.ts)

- **metadataSchema**: Zod schema for event metadata.
- **baseEventSchema**: Zod schema for base event structure.
- **validateEvent**: Function to validate an event against its schema.
- **EventMetadata**: Type inferred from `metadataSchema`.

## [events/state.ts](../libs/types/src/events/state.ts)

- **EventBusState**: Interface with fields `config`, `handlers`, `rabbitmqChannel`, `rabbitmqConnection`, `redisClient`.
- **EventBus**: Type with methods `publish`, `subscribe`, `close`.

## [events/index.ts](../libs/types/src/events/index.ts)

- **UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent, LoginAttemptedEvent, OTPGeneratedEvent**: Interfaces for auth events.
- **KYCVerifiedEvent, KYCRejectedEvent, EmploymentEligibilityUpdatedEvent**: Interfaces for consumed auth events.
- **AuthEvent**: Union type of auth events.
- **ConsumedAuthEvent**: Union type of consumed auth events.
- Re-exports core event types and utilities from `types`.
- Re-exports `validateEvent`, `EventMetadata` from `validation`.
- Re-exports `EVENT_TYPES` from `constants`.
- Re-exports additional event utilities from `config`, `state`, `handlers`, `academic`.

## [events/handlers.ts](../libs/types/src/events/handlers.ts)

- **Event**: Interface with fields `type`, `data`, `metadata`.
- **EventHandler**: Type for event handler function.

## [events/constants.ts](../libs/types/src/events/constants.ts)

- **EVENT_TYPES**: Object with various event types like `USER_CREATED`, `KYC_SUBMITTED`, `SCHOOL_CREATED`, etc.
- **EventType**: Type for keys of `EVENT_TYPES`.

## [events/config.ts](../libs/types/src/events/config.ts)

- **EventBusConfig**: Interface with fields `serviceName`, `rabbitmq`, `redis`.
- **PublishOptions**: Interface with fields `persistent`, `priority`, `cache`.
- **SubscribeOptions**: Interface with fields `queueName`, `durable`, `useCache`.

## [events/academic.ts](../libs/types/src/events/academic.ts)

- **AcademicEvents**: Interface with various academic event types like `ACADEMIC_YEAR_CREATED`, `TERM_STARTED`, `GRADE_RECORDED`, etc.

## [logger/index.ts](../libs/types/src/logger/index.ts)

- Re-exports from `types`.

## [logger/types.ts](../libs/types/src/logger/types.ts)

- **LOG_LEVELS**: Object with log level constants like `TRACE`, `DEBUG`, `INFO`, etc.
- **LogLevel**: Type for log level values.
- **BaseContext**: Interface with fields `service`, `environment`, `timestamp`, `correlationId`.
- **LogContext**: Interface extending `BaseContext` with additional fields.
- **LoggerOptions**: Interface with fields `service`, `environment`, `minLevel`, `redactPaths`, `formatters`, `serializers`.
- **LogFn**: Type for logger function.
- **BaseLogger**: Interface with fields `level`, `silent`.
- **Logger**: Interface extending `BaseLogger` with methods `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `child`.
- **RequestContext**: Interface extending `BaseContext` with fields `path`, `method`, `userAgent`, `ip`, `userId`, `sessionId`, `duration`, `statusCode`.
- **ErrorContext**: Interface extending `BaseContext` with fields `code`, `message`, `statusCode`, `metadata`, `stack`, `requestId`, `path`, `method`, `originalError`.
- **OperationContext**: Interface extending `BaseContext` with fields `operation`, `duration`, `result`.
- **RequestLogger**: Interface extending `Logger` with methods `request`, `response`.
- **ErrorLogger**: Interface extending `Logger` with methods `logError`, `logErrorAndReturn`.
- **ServiceContext**: Type for service context values like `api`, `database`, `cache`, `queue`, `auth`, `file`, `integration`.

## [validation/index.ts](../libs/types/src/validation/index.ts)

- Re-exports from `base`.

## [validation/base.ts](../libs/types/src/validation/base.ts)

- **stringSchema**: Object with Zod schemas for string validation like `email`, `uuid`, `nonEmpty`, `url`, `date`.
- **numberSchema**: Object with Zod schemas for number validation like `positive`, `nonNegative`, `percentage`, `port`.
- **commonSchemas**: Object with common schemas like `metadata`, `timestamps`, `pagination`.
- **ValidationResult**: Type for validation result.
- **createValidationResult**: Function to create a validation result.
- **validateWithSchema**: Function to validate data with a Zod schema.

## [user/types.ts](../libs/types/src/user/types.ts)

- **Subscription**: Interface with fields `schoolId`, `status`.
- **UserAttributes**: Interface with optional field `subscriptions`.

## [database/index.ts](../libs/types/src/database/index.ts)

- **PrismaClient**: Type alias for `BasePrismaClient`.
- **Profile**: Type alias for `PrismaProfile`.

## [file/types.ts](../libs/types/src/file/types.ts)

- **FileType, FileCategory, FileAccessLevel, StorageProvider**: Re-exported from `@eduflow/prisma`.
- **FileMetadata**: Interface with fields `size`, `mimeType`, `originalName`, `encoding`, and additional fields.
- **FileUploadResult**: Interface with fields `id`, `url`, `type`, `category`, `metadata`, `createdAt`.

## [errors/index.ts](../libs/types/src/errors/index.ts)

- **ErrorCategory, ErrorCodeMap, ErrorCode, ValidationErrorMetadata, FileErrorMetadata, AuthErrorMetadata, SystemErrorMetadata, ErrorMetadata, ErrorDetails, AppError, ErrorResponse**: Re-exported from `types`.
- **errorUtils, HTTP_STATUS_CODES**: Re-exported from `utils`.

## [errors/types.ts](../libs/types/src/errors/types.ts)

- **ErrorCategory**: Type with values `AUTH`, `RESOURCE`, `VALIDATION`, `FILE`, `SYSTEM`.
- **ErrorCodeMap**: Type mapping categories to error codes.
- **ErrorCode**: Type for all possible error codes.
- **ValidationErrorMetadata**: Interface with fields `field`, `value`, `constraint`, `additionalFields`.
- **FileErrorMetadata**: Interface with fields `filename`, `size`, `type`, `path`, `quota`.
- **AuthErrorMetadata**: Interface with fields `userId`, `requiredRoles`, `actualRoles`, `tokenExpiry`.
- **SystemErrorMetadata**: Interface with fields `service`, `operation`, `timestamp`, `requestId`.
- **ErrorMetadata**: Type mapping error codes to metadata types.
- **ErrorDetails**: Interface with fields `code`, `message`, `cause`, `metadata`.
- **AppError**: Interface with fields `name`, `message`, `statusCode`, `code`, `cause`, `metadata`.
- **ErrorResponse**: Interface with field `error`. 