import type { FileType as PrismaFileType, FileCategory, FileAccessLevel, StorageProvider } from '@eduflow/prisma';

// Re-export the types from Prisma
export { FileType, FileCategory, FileAccessLevel, StorageProvider } from '@eduflow/prisma';

// Export any additional file-related types or interfaces here
export interface FileMetadata {
  size: number;
  mimeType: string;
  originalName: string;
  encoding: string;
  [key: string]: unknown;
}

export interface FileUploadResult {
  id: string;
  url: string;
  type: PrismaFileType;
  category: FileCategory;
  metadata: FileMetadata;
  createdAt: Date;
} 