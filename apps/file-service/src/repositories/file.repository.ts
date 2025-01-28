import { prisma, type File, type Prisma } from '@eduflow/prisma';
import type { FileType, FileCategory, FileAccessLevel, StorageProvider } from '@eduflow/types';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createError, type BaseError } from '@eduflow/common';

export type FileInput = Prisma.FileCreateInput;

export const createFile = (data: FileInput): TE.TaskEither<BaseError, File> => {
  return pipe(
    TE.tryCatch(
      () => prisma.file.create({ data }),
      (error) => createError('Failed to create file', 'FILE_ERROR', 500, error)
    )
  );
};

export const getFileById = (id: string): TE.TaskEither<BaseError, File | null> => {
  return pipe(
    TE.tryCatch(
      () => prisma.file.findUnique({ where: { id } }),
      (error) => createError('Failed to get file', 'FILE_ERROR', 500, error)
    )
  );
};

export const updateFile = (id: string, data: Prisma.FileUpdateInput): TE.TaskEither<BaseError, File> => {
  return pipe(
    TE.tryCatch(
      () => prisma.file.update({ where: { id }, data }),
      (error) => createError('Failed to update file', 'FILE_ERROR', 500, error)
    )
  );
};

export const deleteFile = (id: string): TE.TaskEither<BaseError, File> => {
  return pipe(
    TE.tryCatch(
      () => prisma.file.delete({ where: { id } }),
      (error) => createError('Failed to delete file', 'FILE_ERROR', 500, error)
    )
  );
};

export const listFiles = (params: {
  ownerId?: string;
  type?: FileType;
  category?: FileCategory;
  skip?: number;
  take?: number;
}): TE.TaskEither<BaseError, File[]> => {
  const { ownerId, type, category, skip = 0, take = 10 } = params;
  return pipe(
    TE.tryCatch(
      () =>
        prisma.file.findMany({
          where: {
            ...(ownerId && { ownerId }),
            ...(type && { type }),
            ...(category && { category }),
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      (error) => createError('Failed to list files', 'FILE_ERROR', 500, error)
    )
  );
};
