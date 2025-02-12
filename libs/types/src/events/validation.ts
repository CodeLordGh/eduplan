import { z } from 'zod';
import { stringSchema, validateWithSchema } from '../validation';
import { Event, EventType, EventDataMap } from './types';

// Base metadata schema
export const metadataSchema = z.object({
  version: stringSchema.nonEmpty,
  source: stringSchema.nonEmpty,
  correlationId: stringSchema.uuid,
  timestamp: z.date(),
  schemaVersion: stringSchema.nonEmpty,
});

// Base event schema
export const baseEventSchema = z.object({
  type: z.enum([EventType.USER_CREATED, EventType.USER_UPDATED]), // Add all event types here
  data: z.unknown(),
  metadata: metadataSchema,
});

// Type-safe validation function type
type ValidateEventDataFn<T = unknown> = (data: unknown) => ReturnType<typeof validateWithSchema<T>>;

/**
 * Validates an event against its schema
 */
export const validateEvent = <T extends EventType>(
  event: Event<unknown>
): Promise<Event<EventDataMap[T]>> =>
  new Promise((resolve, reject) => {
    try {
      // Validate base event structure
      const baseValidation = validateWithSchema(baseEventSchema, event);
      if (!baseValidation.success) {
        throw new Error(`Invalid event structure: ${baseValidation.error}`);
      }

      // Get and validate event-specific schema
      const schema = getEventSchema(event.type as T);
      if (!schema) {
        throw new Error(`Unknown event type: ${event.type}`);
      }

      const dataValidation = validateWithSchema(schema, event.data);
      if (!dataValidation.success) {
        throw new Error(`Invalid event data for ${event.type}: ${dataValidation.error}`);
      }

      // Return the validated event with the correct type
      resolve({
        ...event,
        data: dataValidation.data,
      } as Event<EventDataMap[T]>);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });

/**
 * Get the schema for a specific event type
 */
function getEventSchema<T extends EventType>(type: T): z.ZodType<EventDataMap[T]> | undefined {
  // Import schemas lazily to avoid circular dependencies
  const { authEventSchemas } = require('../auth/events');
  const { kycEventSchemas } = require('../kyc/events');

  if (type in authEventSchemas) {
    return authEventSchemas[type as keyof typeof authEventSchemas];
  }

  if (type in kycEventSchemas) {
    return kycEventSchemas[type as keyof typeof kycEventSchemas];
  }

  return undefined;
}

// Export only validation-specific types
export type EventMetadata = z.infer<typeof metadataSchema>;
