import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createKYCService } from '../service/kyc.service';
import { DocumentType, VerificationStatus } from '@eduflow/types';
import { z } from 'zod';
import { authenticate, RequestWithUser } from '@eduflow/middleware';


const submitDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  documentUrls: z.array(z.string().url()),
  metadata: z.record(z.unknown()),
});

const verifyDocumentSchema = z.object({
  status: z.nativeEnum(VerificationStatus),
  notes: z.string().optional(),
});

type SubmitDocumentBody = z.infer<typeof submitDocumentSchema>;

export const kycRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
): Promise<void> => {
  const kycService = createKYCService({ prisma: fastify.prisma, redis: fastify.redis });

  // Submit document
  fastify.post<{
    Body: SubmitDocumentBody;
  }>('/documents', {
    schema: {
      tags: ['documents'],
      description: 'Submit a new KYC document for verification',
      body: {
        type: 'object',
        required: ['type', 'documentUrls', 'metadata'],
        properties: {
          type: { type: 'string', enum: Object.values(DocumentType) },
          documentUrls: { 
            type: 'array',
            items: { type: 'string', format: 'uri' }
          },
          metadata: { 
            type: 'object',
            additionalProperties: true
          }
        }
      },
      response: {
        201: {
          description: 'Document submitted successfully',
          type: 'object',
          required: ['id', 'userId', 'type', 'status', 'documentUrls', 'metadata', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: Object.values(DocumentType) },
            status: { type: 'string', enum: Object.values(VerificationStatus) },
            documentUrls: { 
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            metadata: { 
              type: 'object',
              additionalProperties: true
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            verifiedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        400: {
          description: 'Invalid request body',
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: async (request: RequestWithUser & { body: SubmitDocumentBody }, reply) => {
      const { type, documentUrls, metadata } = request.body;
      const userId = request.user.id;

      const result = await kycService.submitDocument(
        userId,
        type,
        documentUrls,
        metadata
      )();

      if (result._tag === 'Left') {
        throw result.left;
      }

      return reply.status(201).send(result.right);
    },
  });

  // Verify document
  fastify.patch<{
    Params: { documentId: string };
    Body: z.infer<typeof verifyDocumentSchema>;
  }>('/documents/:documentId/verify', {
    schema: {
      tags: ['verification'],
      description: 'Verify a KYC document',
      params: {
        type: 'object',
        required: ['documentId'],
        properties: {
          documentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: Object.values(VerificationStatus) },
          notes: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Document verified successfully',
          type: 'object',
          required: ['id', 'status', 'verifiedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: Object.values(VerificationStatus) },
            verifiedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: async (request: RequestWithUser & { 
      params: { documentId: string },
      body: z.infer<typeof verifyDocumentSchema>
    }, reply) => {
      const { documentId } = request.params;
      const { status, notes } = request.body;
      const verifiedBy = request.user.id;

      const result = await kycService.verifyDocument(
        documentId,
        status,
        verifiedBy,
        notes
      )();

      if (result._tag === 'Left') {
        throw result.left;
      }

      return reply.send(result.right);
    },
  });

  // Get user documents
  fastify.get('/documents', {
    schema: {
      tags: ['documents'],
      description: 'Get all documents for the authenticated user',
      response: {
        200: {
          description: 'List of user documents',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: Object.values(DocumentType) },
              status: { type: 'string', enum: Object.values(VerificationStatus) },
              documentUrls: { 
                type: 'array',
                items: { type: 'string', format: 'uri' }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: async (request: RequestWithUser, reply) => {
      const result = await kycService.getDocumentsByUser(request.user.id)();

      if (result._tag === 'Left') {
        throw result.left;
      }

      return reply.send(result.right);
    },
  });

  // Get verification history
  fastify.get<{
    Params: { entityId: string };
  }>('/history/:entityId', {
    schema: {
      tags: ['verification'],
      description: 'Get verification history for an entity',
      params: {
        type: 'object',
        required: ['entityId'],
        properties: {
          entityId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Verification history',
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'status', 'verifiedBy', 'createdAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string', enum: Object.values(VerificationStatus) },
              verifiedBy: { type: 'string', format: 'uuid' },
              notes: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: async (request: RequestWithUser & { params: { entityId: string } }, reply) => {
      const result = await kycService.getVerificationHistory(request.params.entityId)();

      if (result._tag === 'Left') {
        throw result.left;
      }

      return reply.send(result.right);
    },
  });
}; 