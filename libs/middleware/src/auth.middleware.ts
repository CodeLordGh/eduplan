import { FastifyRequest } from 'fastify';
import { UserRole } from '@eduflow/types';
import { createUnauthorizedError, createInvalidTokenError } from '@eduflow/common';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type RequestWithUser = FastifyRequest & {
  user: AuthenticatedUser;
};

export const extractToken = (request: FastifyRequest): string => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw createUnauthorizedError('No token provided');
  }
  return token;
};

export const verifyAndAttachUser = async (
  request: FastifyRequest
): Promise<RequestWithUser> => {
  try {
    const user = await request.jwtVerify();
    return Object.assign(request, { user }) as RequestWithUser;
  } catch (error) {
    throw createInvalidTokenError(error);
  }
};

export const authenticate = async (request: FastifyRequest): Promise<RequestWithUser> =>
  verifyAndAttachUser(request);

export const checkRole = (allowedRoles: UserRole[]) => (user: AuthenticatedUser): void => {
  if (!allowedRoles.includes(user.role)) {
    throw createUnauthorizedError(
      `User role ${user.role} is not authorized to access this resource`
    );
  }
};

export const authorize = (roles: UserRole[]) => async (request: FastifyRequest): Promise<void> => {
  const authenticatedRequest = await authenticate(request);
  checkRole(roles)(authenticatedRequest.user);
}; 