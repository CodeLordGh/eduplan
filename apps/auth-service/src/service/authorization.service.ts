import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { AccessRequest, AuthContext } from '../domain/types'
import { PrismaClient, Role } from '@eduflow/prisma'

const prisma = new PrismaClient()

const getUserRoles = (userId: string): TE.TaskEither<Error, Role[]> => {
  return () =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true }
    }).then(user => {
      if (!user) {
        return E.left(new Error('User not found'))
      }
      return E.right(user.roles)
    }).catch((_: unknown) => E.left(new Error('Failed to get user roles')))
}

const validatePermission = (permission: string) => 
  (roles: Role[]): TE.TaskEither<Error, Role[]> => {
    // Here you would implement your permission validation logic
    // For now, we'll just pass through
    return TE.right(roles)
  }

const validateContext = (context: AuthContext) => 
  (roles: Role[]): TE.TaskEither<Error, boolean> => {
    // Here you would implement your context validation logic
    // For example, checking if the user has access to the specified school
    return TE.right(true)
  }

export const validateAccess = (
  request: AccessRequest
): TE.TaskEither<Error, boolean> =>
  pipe(
    getUserRoles(request.userId),
    TE.chain(validatePermission(request.permission)),
    TE.chain(validateContext(request.context))
  )

const updateUserRole = (
  userId: string,
  role: Role
): TE.TaskEither<Error, void> => {
  return () =>
    prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          push: role
        }
      }
    }).then(() => E.right(undefined))
      .catch((_: unknown) => E.left(new Error('Failed to update user role')))
}

export const delegateRole = (
  fromUserId: string,
  toUserId: string,
  role: Role
): TE.TaskEither<Error, void> =>
  pipe(
    getUserRoles(fromUserId),
    TE.chain(roles => {
      if (!roles.includes(role)) {
        return TE.left(new Error('Source user does not have the role to delegate'))
      }
      return updateUserRole(toUserId, role)
    })
  ) 