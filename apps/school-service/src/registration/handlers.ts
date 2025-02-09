import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createLogger, createErrorLogger, Logger } from '@eduflow/logger';
import { validateAccess } from '@eduflow/common';
import { 
  AppError, 
  ValidationResult, 
  UserAttributes, 
  KYCStatus,
  EmploymentEligibilityStatus,
  ResourceAction
} from '@eduflow/types';
import { createAppError } from '@eduflow/common';
import { 
  RegistrationEvent, 
  VerificationEvent,
  EventContext,
  OperationContext,
  SchoolRegistrationResult,
  VerificationHistory
} from './types';
import { 
  createSchoolRegistrationPolicy,
  createVerificationPolicy 
} from './policies/school';
import { checkSchoolRegistrationRateLimit } from './rate-limit';
import { 
  processRegistration,
  processVerification,
  updateVerificationStatus,
  emitVerificationEvents 
} from './services';

// Create shared logger instances
const logger = createLogger({
  service: 'school-service',
  minLevel: 'info'
});

const errorLogger = createErrorLogger(logger);

// Enhanced context type that includes user and policy
interface EnhancedOperationContext extends OperationContext {
  user: UserAttributes;
  policy: ReturnType<typeof createSchoolRegistrationPolicy>;
  event: RegistrationEvent | VerificationEvent;
}

// Type guard for VerificationEvent
const isVerificationEvent = (event: RegistrationEvent | VerificationEvent): event is VerificationEvent => {
  return event.type === 'VERIFICATION_STATUS_CHANGED';
};

// Type guard for RegistrationEvent
const isRegistrationEvent = (event: RegistrationEvent | VerificationEvent): event is RegistrationEvent => {
  return event.type === 'REGISTRATION_INITIATED';
};

// Enhanced logger creation for operations
const createOperationLogger = (
  context: OperationContext
): Logger => 
  logger.child({
    operation: context.operationType,
    requestId: context.requestId,
    userId: context.userId,
    clientInfo: context.clientInfo
  });

// Validate access and return enhanced context
const validateAccessAndContext = (
  ctx: EnhancedOperationContext
): TE.TaskEither<AppError, EnhancedOperationContext> => {
  const result = validateAccess(ctx.user, ctx.policy, ctx);
  return result.granted 
    ? TE.right(ctx)
    : TE.left(createAppError({
        code: 'FORBIDDEN',
        message: result.reason || 'Access denied',
        metadata: { userId: ctx.userId }
      }));
};

// Registration Event Handler with enhanced logging
export const handleRegistrationEvent = (
  event: RegistrationEvent,
  context: EventContext
): TE.TaskEither<AppError, void> => {
  const operationLogger = createOperationLogger(context);

  const enhancedContext: EnhancedOperationContext = {
    ...context,
    event,
    logger: operationLogger,
    user: {
      id: context.userId,
      email: '', // Will be populated by validateAccess
      status: 'ACTIVE',
      globalRoles: [],
      schoolRoles: {},
      kyc: { status: KYCStatus.NOT_STARTED },
      employment: { 
        status: EmploymentEligibilityStatus.UNVERIFIED,
        verifiedAt: undefined,
        verifiedBy: undefined
      },
      access: { failedAttempts: 0 },
      context: {}
    },
    policy: createSchoolRegistrationPolicy('CREATE')
  };

  const validateRegistrationEvent = (
    ctx: EnhancedOperationContext
  ): TE.TaskEither<AppError, RegistrationEvent> => {
    if (!isRegistrationEvent(ctx.event)) {
      return TE.left(createAppError({
        code: 'VALIDATION_ERROR',
        message: 'Expected registration event',
        metadata: {
          field: 'event.type',
          value: ctx.event.type,
          constraint: 'must be REGISTRATION_INITIATED',
          additionalFields: {
            received: ctx.event.type,
            expected: 'REGISTRATION_INITIATED'
          }
        }
      }));
    }
    return TE.right(ctx.event);
  };

  return pipe(
    TE.right(enhancedContext),
    TE.chainFirst(ctx => checkSchoolRegistrationRateLimit(ctx, operationLogger)),
    TE.chain(validateAccessAndContext),
    TE.tap(ctx => 
      TE.right(operationLogger.info('Access validation successful', { ctx }))
    ),
    TE.chain(validateRegistrationEvent),
    TE.chain(processRegistration),
    TE.tap((result: SchoolRegistrationResult) => 
      TE.right(operationLogger.info('Registration processed successfully', { result }))
    ),
    TE.map(() => undefined),
    TE.mapLeft(error => {
      errorLogger.logError(error, {
        correlationId: context.requestId
      });
      return createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process registration event',
        cause: error,
        metadata: {
          service: 'school-service',
          operation: 'registration',
          timestamp: new Date()
        }
      });
    })
  );
};

// Verification Event Handler
export const handleVerificationEvent = (
  event: VerificationEvent,
  context: EventContext
): TE.TaskEither<AppError, void> => {
  const operationLogger = createOperationLogger(context);

  const enhancedContext: EnhancedOperationContext = {
    ...context,
    event,
    logger: operationLogger,
    user: {
      id: context.userId,
      email: '', // Will be populated by validateAccess
      status: 'ACTIVE',
      globalRoles: [],
      schoolRoles: {},
      kyc: { status: KYCStatus.NOT_STARTED },
      employment: { 
        status: EmploymentEligibilityStatus.UNVERIFIED,
        verifiedAt: undefined,
        verifiedBy: undefined
      },
      access: { failedAttempts: 0 },
      context: {}
    },
    policy: createSchoolRegistrationPolicy('UPDATE')
  };

  const validateVerificationEvent = (
    ctx: EnhancedOperationContext
  ): TE.TaskEither<AppError, VerificationEvent> => {
    if (!isVerificationEvent(ctx.event)) {
      return TE.left(createAppError({
        code: 'VALIDATION_ERROR',
        message: 'Expected verification event',
        metadata: {
          field: 'event.type',
          value: ctx.event.type,
          constraint: 'must be VERIFICATION_STATUS_CHANGED',
          additionalFields: {
            received: ctx.event.type,
            expected: 'VERIFICATION_STATUS_CHANGED'
          }
        }
      }));
    }
    return TE.right(ctx.event);
  };

  return pipe(
    TE.right(enhancedContext),
    TE.chain(validateAccessAndContext),
    TE.tap(ctx => 
      TE.right(operationLogger.info('Access validation successful', { ctx }))
    ),
    TE.chain(validateVerificationEvent),
    TE.chain(processVerification),
    TE.chain(result => 
      pipe(
        emitVerificationEvents(event.data),
        TE.map(() => result)
      )
    ),
    TE.map(() => undefined),
    TE.mapLeft(error => {
      errorLogger.logError(error, {
        correlationId: context.requestId
      });
      return createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process verification event',
        cause: error,
        metadata: {
          service: 'school-service',
          operation: 'verification',
          timestamp: new Date()
        }
      });
    })
  );
}; 