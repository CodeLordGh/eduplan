import { prisma } from '@eduflow/prisma';
import type { PrismaClient } from '@eduflow/types';
import { EVENTS, USER_ROLES, SYSTEM_OCCUPATIONS } from '../utils/constants';
import { validateProfile, validateOccupation } from '../validators/profile.validator';
import { createProfile, getProfileByUserId } from '../repositories/profile.repository';

type EventPublisher = (event: string, data: unknown) => Promise<void>;

// Event handler for user creation
export const handleUserCreated = async (
  publishEvent: EventPublisher,
  event: {
    userId: string;
    email: string;
    role: string;
  }
): Promise<void> => {
  const { userId, email, role } = event;

  // Check if profile already exists
  const existingProfile = await getProfileByUserId(prisma as unknown as PrismaClient, userId);
  if (existingProfile) return;

  // Determine occupation based on role
  const occupation = Object.keys(SYSTEM_OCCUPATIONS).includes(role)
    ? SYSTEM_OCCUPATIONS[role as keyof typeof SYSTEM_OCCUPATIONS]
    : '';

  // Create base profile
  const profile = await createProfile(prisma as unknown as PrismaClient, userId, {
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(), // Temporary date, will be updated later
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    occupation,
  });

  // Publish profile created event
  await publishEvent(EVENTS.PROFILE_CREATED, {
    userId,
    occupation,
    timestamp: new Date(),
  });
};

// Event handler for user deletion
export const handleUserDeleted = async (
  publishEvent: EventPublisher,
  event: {
    userId: string;
  }
): Promise<void> => {
  const { userId } = event;

  // Check if profile exists
  const profile = await getProfileByUserId(prisma as unknown as PrismaClient, userId);
  if (!profile) return;

  // Delete profile
  await prisma.profile.delete({
    where: { userId },
  });

  // Publish profile deleted event
  await publishEvent(EVENTS.PROFILE_DELETED, {
    userId,
    timestamp: new Date(),
  });
};

// Event handler for KYC verification
export const handleKYCVerified = async (
  publishEvent: EventPublisher,
  event: {
    userId: string;
    documentType: string;
  }
): Promise<void> => {
  const { userId } = event;

  // Update profile metadata with KYC status
  await (prisma as unknown as PrismaClient).profile.update({
    where: { userId },
    data: {
      metadata: {
        kycVerified: true,
        kycVerifiedAt: new Date(),
      },
    },
  });

  // Publish profile updated event
  await publishEvent(EVENTS.PROFILE_UPDATED, {
    userId,
    updates: { metadata: { kycVerified: true } },
    timestamp: new Date(),
  });
};
