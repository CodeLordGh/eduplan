import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { Event } from '../types';
import { EventBusOperations } from '../factory';
import { UserCreatedEvent, KYCVerifiedEvent, EmploymentEligibilityUpdatedEvent } from '@eduflow/types';
import { Role } from '@eduflow/prisma';
import { createLogger, LogContext } from '@eduflow/logger';

const logger = createLogger({
  service: 'auth-service',
  environment: process.env.NODE_ENV || 'development'
});

// Event handlers
const handleKYCVerification = (
  event: Event<KYCVerifiedEvent>
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const context: LogContext = {
          service: 'auth-service',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          userId: event.payload.userId,
          documentType: event.payload.documentType,
          verificationId: event.payload.verificationId,
          correlationId: event.metadata.correlationId
        };

        logger.info('Processing KYC verification event', context);

        // Process verification
        // ... implementation ...

        logger.info('KYC verification processed successfully', context);
      },
      error => {
        const context = {
          service: 'auth-service',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          userId: event.payload.userId,
          correlationId: event.metadata.correlationId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };
        logger.error('Failed to process KYC verification', context);
        return new Error(`Failed to handle KYC verification: ${error}`);
      }
    )
  );

const handleEmploymentEligibilityUpdate = (
  event: Event<EmploymentEligibilityUpdatedEvent>
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const context: LogContext = {
          service: 'auth-service',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          userId: event.payload.userId,
          status: event.payload.status,
          correlationId: event.metadata.correlationId
        };

        logger.info('Processing employment eligibility update', context);

        // Process eligibility update
        // ... implementation ...

        logger.info('Employment eligibility updated successfully', context);
      },
      error => {
        const context = {
          service: 'auth-service',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          userId: event.payload.userId,
          correlationId: event.metadata.correlationId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };
        logger.error('Failed to process employment eligibility update', context);
        return new Error(`Failed to handle employment eligibility update: ${error}`);
      }
    )
  );

// Event publishing
export const publishUserCreated = (
  eventBus: EventBusOperations,
  userId: string,
  email: string,
  role: Role
): TE.TaskEither<Error, void> => {
  const correlationId = `user-${userId}`;
  const context: LogContext = {
    service: 'auth-service',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    userId,
    email,
    role,
    correlationId
  };

  logger.info('Creating user event', context);

  const event: Event<UserCreatedEvent> = {
    type: 'USER_CREATED',
    payload: {
      userId,
      email,
      role,
      createdAt: new Date()
    },
    metadata: {
      correlationId,
      timestamp: new Date().toISOString(),
      source: 'auth-service',
      version: '1.0.0'
    }
  };

  return pipe(
    eventBus.publish(event, {
      persistent: true,
      cache: true,
      cacheTTL: 3600,
      priority: 1
    }),
    TE.map(() => {
      logger.info('User created event published successfully', context);
    }),
    TE.mapLeft(error => {
      logger.error('Failed to publish user created event', {
        ...context,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return error;
    })
  );
};

// Event subscriptions
export const setupAuthEventHandlers = (
  eventBus: EventBusOperations
): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.chain(() => {
      logger.info('Setting up KYC verification handler');
      return eventBus.subscribe<KYCVerifiedEvent>(
        'KYC_VERIFIED',
        async event => {
          const result = await handleKYCVerification(event)();
          if (E.isLeft(result)) throw result.left;
        },
        {
          useCache: true,
          pattern: 'kyc.*',
          queue: 'auth.kyc-verification',
          durable: true
        }
      );
    }),
    TE.chain(() => {
      logger.info('Setting up employment eligibility handler');
      return eventBus.subscribe<EmploymentEligibilityUpdatedEvent>(
        'EMPLOYMENT_ELIGIBILITY_UPDATED',
        async event => {
          const result = await handleEmploymentEligibilityUpdate(event)();
          if (E.isLeft(result)) throw result.left;
        },
        {
          useCache: false,
          queue: 'auth.employment-eligibility',
          durable: true
        }
      );
    }),
    TE.map(() => {
      logger.info('Auth event handlers setup completed successfully');
    }),
    TE.mapLeft(error => {
      logger.error('Failed to setup auth event handlers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return error;
    })
  );

// Example usage
export const createAuthService = (
  eventBus: EventBusOperations
): TE.TaskEither<Error, void> =>
  pipe(
    setupAuthEventHandlers(eventBus),
    TE.chain(() =>
      publishUserCreated(
        eventBus,
        'user123',
        'user@example.com',
        Role.TEACHER
      )
    )
  ); 