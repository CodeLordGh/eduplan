import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { AuditEvent, AuthEventType } from '../domain/types'
import { PrismaClient } from '@eduflow/prisma'

const prisma = new PrismaClient()

const validateEvent = (event: AuditEvent): TE.TaskEither<Error, AuditEvent> => {
  // Here you would implement validation logic for the audit event
  // For now, we'll just pass through
  return TE.right(event)
}

const enrichEventMetadata = (event: AuditEvent): TE.TaskEither<Error, AuditEvent> => {
  // Here you would add additional metadata to the event
  // For example, adding user agent info, geolocation, etc.
  return TE.right(event)
}

const persistEvent = (event: AuditEvent): TE.TaskEither<Error, void> => {
  return () =>
    prisma.verificationHistory.create({
      data: {
        entityId: event.userId,
        entityType: 'USER',
        status: event.status === 'SUCCESS' ? 'VERIFIED' : 'REJECTED',
        notes: JSON.stringify({
          eventType: event.eventType,
          metadata: event.metadata,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        })
      }
    }).then(() => E.right(undefined))
      .catch((_: unknown) => E.left(new Error('Failed to persist audit event')))
}

export const logAuthEvent = (
  event: AuditEvent
): TE.TaskEither<Error, void> =>
  pipe(
    validateEvent(event),
    TE.chain(enrichEventMetadata),
    TE.chain(persistEvent)
  )

export const queryAuditEvents = (
  filters: {
    userId?: string
    eventType?: AuthEventType
    fromDate?: Date
    toDate?: Date
  }
): TE.TaskEither<Error, ReadonlyArray<AuditEvent>> => {
  return () =>
    prisma.verificationHistory.findMany({
      where: {
        entityType: 'USER',
        entityId: filters.userId,
        createdAt: {
          gte: filters.fromDate,
          lte: filters.toDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }).then(records => {
      const events: AuditEvent[] = records.map(record => {
        const notes = JSON.parse(record.notes || '{}')
        return {
          eventType: notes.eventType || 'LOGIN',
          userId: record.entityId,
          metadata: notes.metadata || {},
          timestamp: record.createdAt,
          status: record.status === 'VERIFIED' ? 'SUCCESS' : 'FAILURE',
          ipAddress: notes.ipAddress || '',
          userAgent: notes.userAgent || ''
        }
      })
      return E.right(events)
    }).catch((_: unknown) => E.left(new Error('Failed to query audit events')))
} 