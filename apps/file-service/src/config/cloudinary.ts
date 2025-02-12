import { v2 as cloudinary } from 'cloudinary';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createError, type BaseError } from '@eduflow/common';

export const initCloudinary = (): TE.TaskEither<BaseError, void> => {
  return pipe(
    TE.tryCatch(
      () => {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });
        return Promise.resolve();
      },
      (error) => createError('Failed to initialize Cloudinary', 'CLOUDINARY_ERROR', 500, error)
    )
  );
};

export const uploadToCloudinary = (
  file: Buffer,
  options: { folder: string; public_id?: string }
): TE.TaskEither<BaseError, { url: string; public_id: string }> => {
  return pipe(
    TE.tryCatch(
      () =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: options.folder,
              public_id: options.public_id,
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) return reject(new Error('Upload failed'));
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          uploadStream.end(file);
        }),
      (error) => createError('Failed to upload file to Cloudinary', 'CLOUDINARY_ERROR', 500, error)
    )
  );
};
