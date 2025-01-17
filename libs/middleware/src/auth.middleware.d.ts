import { FastifyRequest } from 'fastify';
import { UserRole } from '@eduflow/types';
export type AuthenticatedUser = {
    id: string;
    email: string;
    role: UserRole;
};
export type RequestWithUser = FastifyRequest & {
    user: AuthenticatedUser;
};
export declare const extractToken: (request: FastifyRequest) => string;
export declare const verifyAndAttachUser: (request: FastifyRequest) => Promise<RequestWithUser>;
export declare const authenticate: (request: FastifyRequest) => Promise<RequestWithUser>;
export declare const checkRole: (allowedRoles: UserRole[]) => (user: AuthenticatedUser) => void;
export declare const authorize: (roles: UserRole[]) => (request: FastifyRequest) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map