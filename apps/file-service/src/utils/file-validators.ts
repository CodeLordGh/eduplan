import { createFileTypeError, createFileSizeError } from '@eduflow/common';
import { FileType } from '@eduflow/types';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

const ALLOWED_MIME_TYPES = {
  [FileType.DOCUMENT]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  [FileType.VIDEO]: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  [FileType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  [FileType.OTHER]: ['application/octet-stream']
};

const MAX_FILE_SIZES = {
  [FileType.DOCUMENT]: 10 * 1024 * 1024, // 10MB
  [FileType.IMAGE]: 5 * 1024 * 1024, // 5MB
  [FileType.VIDEO]: 100 * 1024 * 1024, // 100MB
  [FileType.AUDIO]: 50 * 1024 * 1024, // 50MB
  [FileType.OTHER]: 10 * 1024 * 1024 // 10MB
};

export const validateFileType = (
  mimeType: string,
  type: FileType
): TE.TaskEither<Error, boolean> => {
  return pipe(
    TE.tryCatch(
      () => {
        const isValid = ALLOWED_MIME_TYPES[type].includes(mimeType);
        if (!isValid) {
          throw createFileTypeError(
            `Invalid mime type ${mimeType} for file type ${type}`,
            { mimeType, type }
          );
        }
        return Promise.resolve(true);
      },
      (error) => error as Error
    )
  );
};

export const validateFileSize = (
  size: number,
  type: FileType
): TE.TaskEither<Error, boolean> => {
  return pipe(
    TE.tryCatch(
      () => {
        const maxSize = MAX_FILE_SIZES[type];
        if (size > maxSize) {
          throw createFileSizeError(
            `File size ${size} bytes exceeds maximum size of ${maxSize} bytes for type ${type}`,
            { size, maxSize, type }
          );
        }
        return Promise.resolve(true);
      },
      (error) => error as Error
    )
  );
};

export const validateFileName = (fileName: string): TE.TaskEither<Error, boolean> => {
  return pipe(
    TE.tryCatch(
      () => {
        // Remove any path components for security
        const sanitizedName = fileName.replace(/^.*[\\\/]/, '');
        
        // Check for valid characters
        const validNameRegex = /^[a-zA-Z0-9-_. ]+$/;
        if (!validNameRegex.test(sanitizedName)) {
          throw createFileTypeError(
            'File name contains invalid characters',
            { fileName: sanitizedName }
          );
        }

        // Check length
        if (sanitizedName.length > 255) {
          throw createFileTypeError(
            'File name is too long',
            { fileName: sanitizedName, length: sanitizedName.length }
          );
        }

        return Promise.resolve(true);
      },
      (error) => error as Error
    )
  );
};
