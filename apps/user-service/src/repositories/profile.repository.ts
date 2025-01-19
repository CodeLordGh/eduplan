import type { PrismaClient } from '@eduflow/types';
import type { Profile } from '@eduflow/types';
import type { ProfileInput } from '../validators/profile.validator';

// Repository functions
export const createProfile = (
  prisma: PrismaClient,
  userId: string,
  data: ProfileInput
) => {
  return prisma.profile.create({
    data: {
      userId,
      ...data,
      address: data.address as any,
      emergencyContact: data.emergencyContact as any
    }
  });
};

export const getProfileByUserId = (
  prisma: PrismaClient,
  userId: string
) =>
  prisma.profile.findUnique({
    where: { userId }
  });

export const updateProfile = (
  prisma: PrismaClient,
  userId: string,
  data: Partial<ProfileInput>
) => {
  const updateData = {
    ...data,
    ...(data.address && { address: data.address as any }),
    ...(data.emergencyContact && { emergencyContact: data.emergencyContact as any })
  };

  return prisma.profile.update({
    where: { userId },
    data: updateData
  });
};

export const deleteProfile = (
  prisma: PrismaClient,
  userId: string
) =>
  prisma.profile.delete({
    where: { userId }
  });

export const getProfiles = (
  prisma: PrismaClient,
  skip: number = 0,
  take: number = 10
) =>
  prisma.profile.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' }
  }); 