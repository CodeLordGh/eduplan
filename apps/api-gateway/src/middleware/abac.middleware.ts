import { FastifyReply, FastifyRequest } from 'fastify';
import { createAppError } from '@eduflow/common';
import { validateAccess } from '@eduflow/common';
import { UserAttributes, AccessPolicy, Role, Permission } from '@eduflow/types';
import { getUserAttributes } from '../services/user.service';
import { getLocationFromIP } from '../services/location.service';

// Extend FastifyRequest with user attributes
interface RequestWithAttributes extends FastifyRequest {
  user: {
    userId: string;
    id: string;
    role: Role;
    permissions: Permission[];
  };
  userAttributes?: UserAttributes;
  requestContext?: Record<string, unknown>;
}

// Enrich request with user attributes
export const enrichRequestWithAttributes = async (req: RequestWithAttributes): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw createAppError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Get base user attributes
    const userAttributes = await getUserAttributes(req.user.userId);

    // Enrich with context
    userAttributes.context = {
      currentSchoolId: req.headers['x-school-id'] as string,
      deviceInfo: {
        id: req.headers['x-device-id'] as string,
        type: req.headers['x-device-type'] as string,
        trustScore: calculateTrustScore(req.headers['x-device-id'] as string, req.headers['x-device-type'] as string),
        lastVerified: new Date()
      },
      location: await getLocationFromIP(req.ip),
    };

    req.userAttributes = userAttributes;
  } catch (error) {
    throw createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to enrich request with user attributes',
      cause: error,
    });
  }
};

// Create ABAC middleware
export const createAbacMiddleware =
  (policy: AccessPolicy) =>
  async (req: RequestWithAttributes, reply: FastifyReply): Promise<void> => {
    try {
      if (!req.userAttributes) {
        await enrichRequestWithAttributes(req);
      }

      const validationResult = await validateAccess(
        req.userAttributes!,
        policy,
        req.requestContext || {}
      );

      if (!validationResult.granted) {
        throw createAppError({
          code: 'FORBIDDEN',
          message: validationResult.reason || 'Access denied',
        });
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      throw createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate access',
        cause: error,
      });
    }
  };

// Helper function to combine multiple ABAC policies
export const combineAbacPolicies =
  (policies: AccessPolicy[]) =>
  async (req: RequestWithAttributes, reply: FastifyReply): Promise<void> => {
    for (const policy of policies) {
      await createAbacMiddleware(policy)(req, reply);
    }
  };

export async function abacMiddleware(
  request: RequestWithAttributes,
  policy: AccessPolicy,
  attributes?: UserAttributes
) {
  try {
    const { user } = request;
    if (!user?.userId) {
      throw createAppError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        metadata: { userId: user?.userId },
      });
    }

    if (!attributes && !request.userAttributes) {
      await enrichRequestWithAttributes(request);
    }

    const userAttributes = attributes || request.userAttributes;
    if (!userAttributes) {
      throw createAppError({
        code: 'FORBIDDEN',
        message: 'User attributes not found',
        metadata: { userId: user.userId },
      });
    }

    const validationResult = await validateAccess(userAttributes, policy);

    if (!validationResult.granted) {
      throw createAppError({
        code: 'FORBIDDEN',
        message: validationResult.reason || 'Access denied',
        metadata: {
          userId: user.userId,
        },
      });
    }
  } catch (error) {
    throw createAppError({
      code: 'FORBIDDEN',
      message: 'Access denied',
      cause: error,
    });
  }
}

function calculateTrustScore(deviceId: string, deviceType: string): number {
  // Simple trust score calculation based on device type
  // Mobile devices and desktop apps are considered more trustworthy than web browsers
  if (!deviceId || !deviceType) return 0;
  
  switch (deviceType.toLowerCase()) {
    case 'mobile_app':
    case 'desktop_app':
      return 0.8;
    case 'web_browser':
      return 0.5;
    default:
      return 0.3;
  }
}
