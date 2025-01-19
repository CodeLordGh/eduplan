import { prisma } from '@eduflow/prisma';
import type { ProfileInput } from '../validators/profile.validator';

// Repository functions
export const createProfile = (
  userId: string,
  data: ProfileInput
) =>
  prisma.profile.create({
    data: {
      userId,
      ...data
    }
  });

export const getProfileByUserId = (
  userId: string
) =>
  prisma.profile.findUnique({
    where: { userId }
  });

export const updateProfile = (
  userId: string,
  data: Partial<ProfileInput>
) =>
  prisma.profile.update({
    where: { userId },
    data
  });

export const deleteProfile = (
  userId: string
) =>
  prisma.profile.delete({
    where: { userId }
  });

export const getProfiles = (
  skip: number = 0,
  take: number = 10
) =>
  prisma.profile.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' }
  }); 