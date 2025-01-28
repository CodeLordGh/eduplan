import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createFile, getFileById, listFiles, deleteFile } from '../repositories/file.repository';
import { QuotaRepository } from '../repositories/quota.repository';
import { uploadToCloudinary } from '../config/cloudinary';
import { FileType, FileCategory, FileAccessLevel, StorageProvider } from '@eduflow/types';
import type { File, Prisma } from '@eduflow/prisma';
import { createFileQuotaError, type BaseError } from '@eduflow/common';
import { EntityType } from '@eduflow/prisma';

const quotaLimits: Record<FileCategory, number> = {
  [FileCategory.PROFILE_PICTURE]: 5 * 1024 * 1024, // 5MB
  [FileCategory.KYC_DOCUMENT]: 10 * 1024 * 1024, // 10MB
  [FileCategory.SCHOOL_DOCUMENT]: 50 * 1024 * 1024, // 50MB
  [FileCategory.STUDENT_WORK]: 20 * 1024 * 1024, // 20MB
  [FileCategory.COURSE_MATERIAL]: 100 * 1024 * 1024, // 100MB
  [FileCategory.OTHER]: 10 * 1024 * 1024 // 10MB
};

export const uploadFile = (
  quotaRepository: QuotaRepository,
  params: {
    file: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    type: FileType;
    category: FileCategory;
    accessLevel: FileAccessLevel;
    ownerId: string;
    ownerType: string;
    accessibleTo: string[];
  }
): TE.TaskEither<BaseError, File> => {
  const {
    file,
    originalName,
    mimeType,
    size,
    type,
    category,
    accessLevel,
    ownerId,
    ownerType,
    accessibleTo
  } = params;

  const createFileData: Prisma.FileCreateInput = {
    name: '',  // Will be set after upload
    originalName,
    mimeType,
    size,
    url: '',  // Will be set after upload
    type,
    category,
    accessLevel,
    provider: StorageProvider.CLOUDINARY,
    ownerId,
    ownerType: ownerType as EntityType,
    accessibleTo,
    metadata: {}  // Will be set after upload
  };

  return pipe(
    uploadToCloudinary(file, {
      folder: `${ownerType}/${ownerId}/${category}`.toLowerCase()
    }),
    TE.chain(({ url, public_id }) =>
      createFile({
        ...createFileData,
        name: public_id,
        url,
        metadata: { public_id }
      })
    ),
    TE.chain((file) =>
      pipe(
        quotaRepository.create({
          fileId: file.id,
          totalSize: size,
          usedSize: size,
          maxSize: quotaLimits[category]
        }),
        TE.mapLeft(error => createFileQuotaError('Failed to create quota', error)),
        TE.map(() => file)
      )
    )
  );
};

export const getFile = (id: string): TE.TaskEither<BaseError, File | null> => getFileById(id);

export const listFilesByOwner = (ownerId: string): TE.TaskEither<BaseError, File[]> => 
  listFiles({ ownerId });

export const deleteFileById = (quotaRepository: QuotaRepository, id: string): TE.TaskEither<BaseError, File> =>
  pipe(
    deleteFile(id),
    TE.chain((file) => 
      pipe(
        quotaRepository.delete(id),
        TE.mapLeft(error => createFileQuotaError('Failed to delete quota', error)),
        TE.map(() => file)
      )
    )
  );
