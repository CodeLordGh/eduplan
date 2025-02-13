import { PrismaClient, FileQuota } from '@eduflow/prisma';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createError, type BaseError } from '@eduflow/common';

export class QuotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    fileId: string;
    totalSize: number;
    usedSize: number;
    maxSize: number;
  }): TE.TaskEither<BaseError, FileQuota> {
    return pipe(
      TE.tryCatch(
        () => this.prisma.fileQuota.create({ data }),
        (error) => createError('Failed to create quota record', 'QUOTA_ERROR', 500, error)
      )
    );
  }

  findByFileId(fileId: string): TE.TaskEither<BaseError, FileQuota | null> {
    return pipe(
      TE.tryCatch(
        () => this.prisma.fileQuota.findUnique({ where: { fileId } }),
        (error) => createError('Failed to find quota', 'QUOTA_ERROR', 500, error)
      )
    );
  }

  update(fileId: string, data: Partial<FileQuota>): TE.TaskEither<BaseError, FileQuota> {
    return pipe(
      TE.tryCatch(
        () =>
          this.prisma.fileQuota.update({
            where: { fileId },
            data,
          }),
        (error) => createError('Failed to update quota', 'QUOTA_ERROR', 500, error)
      )
    );
  }

  delete(fileId: string): TE.TaskEither<BaseError, FileQuota> {
    return pipe(
      TE.tryCatch(
        () => this.prisma.fileQuota.delete({ where: { fileId } }),
        (error) => createError('Failed to delete quota', 'QUOTA_ERROR', 500, error)
      )
    );
  }
}
