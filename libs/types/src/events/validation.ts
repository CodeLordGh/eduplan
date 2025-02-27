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

/**
 * Validates an event against its schema
 */
export const validateEvent = <T extends EventType>(
  event: Event<unknown>
): Promise<Event<EventDataMap[T]>> =>
  (async () => {
    try {
      // Validate base event structure
      const baseValidation = validateWithSchema(baseEventSchema, event);
      if (!baseValidation.success) {
        throw new Error(`Invalid event structure: ${baseValidation.error}`);
      }

      // Get and validate event-specific schema
      const schema = await getEventSchema(event.type as T);
      if (!schema) {
        throw new Error(`Unknown event type: ${event.type}`);
      }

      const dataValidation = validateWithSchema(schema, event.data);
      if (!dataValidation.success) {
        throw new Error(`Invalid event data for ${event.type}: ${dataValidation.error}`);
      }

      // Return the validated event with the correct type
      return {
        ...event,
        data: dataValidation.data,
      } as Event<EventDataMap[T]>;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  })();

/**
 * Get the schema for a specific event type
 */
async function getEventSchema<T extends EventType>(type: T): Promise<z.ZodType<EventDataMap[T]> | undefined> {
  // Import schemas lazily to avoid circular dependencies
  const [{ authEventSchemas }, { kycEventSchemas }] = await Promise.all([
    import('../auth/events'),
    import('../kyc/events')
  ]);

  const schema = type in authEventSchemas 
    ? authEventSchemas[type as keyof typeof authEventSchemas]
    : type in kycEventSchemas
    ? kycEventSchemas[type as keyof typeof kycEventSchemas]
    : undefined;

  return schema as z.ZodType<EventDataMap[T]> | undefined;
}

// Export only validation-specific types
export type EventMetadata = z.infer<typeof metadataSchema>;
