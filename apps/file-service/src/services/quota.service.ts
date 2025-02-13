import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { createError, type BaseError } from '@eduflow/common';
import { QuotaRepository } from '../repositories/quota.repository';
import { FileQuota } from '@eduflow/prisma';

export class QuotaService {
  constructor(private readonly quotaRepository: QuotaRepository) {}

  getQuota(fileId: string): TE.TaskEither<BaseError, FileQuota | null> {
    return this.quotaRepository.findByFileId(fileId);
  }

  updateUsedSize(fileId: string, newSize: number): TE.TaskEither<BaseError, FileQuota> {
    return pipe(
      this.quotaRepository.findByFileId(fileId),
      TE.chain((quota) => {
        if (!quota) {
          return TE.fromEither(E.left(createError('Quota not found', 'QUOTA_ERROR', 404)));
        }

        if (quota.usedSize + newSize > quota.maxSize) {
          return TE.fromEither(E.left(createError('Quota exceeded', 'QUOTA_ERROR', 400)));
        }

        return this.quotaRepository.update(fileId, {
          usedSize: quota.usedSize + newSize,
        });
      })
    );
  }

  checkQuota(fileId: string, size: number): TE.TaskEither<BaseError, boolean> {
    return pipe(
      this.quotaRepository.findByFileId(fileId),
      TE.chain((quota) => {
        if (!quota) {
          return TE.fromEither(E.left(createError('Quota not found', 'QUOTA_ERROR', 404)));
        }

        const hasSpace = quota.usedSize + size <= quota.maxSize;
        return TE.fromEither(E.right(hasSpace));
      })
    );
  }
}
