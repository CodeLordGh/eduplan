import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { createError, type BaseError } from '@eduflow/common';
import { getFileById, updateFile } from '../repositories/file.repository';
import { File, FileAccessLevel } from '@eduflow/prisma';

export const checkAccess = (fileId: string, userId: string): TE.TaskEither<BaseError, boolean> =>
  pipe(
    getFileById(fileId),
    TE.chain((file) => {
      if (!file) {
        return TE.fromEither(E.left(createError('File not found', 'FILE_ERROR', 404)));
      }

      if (file.accessLevel === FileAccessLevel.PUBLIC) {
        return TE.fromEither(E.right(true));
      }

      if (file.ownerId === userId) {
        return TE.fromEither(E.right(true));
      }

      if (file.accessLevel === FileAccessLevel.RESTRICTED && file.accessibleTo.includes(userId)) {
        return TE.fromEither(E.right(true));
      }

      return TE.fromEither(E.right(false));
    })
  );

export const updateAccess = (
  fileId: string,
  params: {
    accessLevel: FileAccessLevel;
    accessibleTo: string[];
  }
): TE.TaskEither<BaseError, File> => updateFile(fileId, params);

export const addAccessUser = (fileId: string, userId: string): TE.TaskEither<BaseError, File> =>
  pipe(
    getFileById(fileId),
    TE.chain((file) => {
      if (!file) {
        return TE.fromEither(E.left(createError('File not found', 'FILE_ERROR', 404)));
      }

      if (file.accessibleTo.includes(userId)) {
        return TE.fromEither(E.right(file));
      }

      return updateFile(fileId, {
        accessibleTo: [...file.accessibleTo, userId],
      });
    })
  );

export const removeAccessUser = (fileId: string, userId: string): TE.TaskEither<BaseError, File> =>
  pipe(
    getFileById(fileId),
    TE.chain((file) => {
      if (!file) {
        return TE.fromEither(E.left(createError('File not found', 'FILE_ERROR', 404)));
      }

      return updateFile(fileId, {
        accessibleTo: file.accessibleTo.filter((id) => id !== userId),
      });
    })
  );
