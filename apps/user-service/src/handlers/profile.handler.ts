import { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@eduflow/types';
import { EVENTS, ERROR_CODES } from '../utils/constants';
import { validateProfile, validatePartialProfile } from '../validators/profile.validator';
import * as profileRepo from '../repositories/profile.repository';

type Dependencies = {
  prisma: PrismaClient;
  publishEvent: (event: string, data: unknown) => Promise<void>;
};

// Get profile by user ID
export const getProfile =
  ({ prisma }: Dependencies) =>
  async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;

    const profile = await profileRepo.getProfileByUserId(prisma, userId);
    if (!profile) {
      return reply.code(404).send({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Profile not found',
      });
    }

    reply.send(profile);
  };

// Create or update profile
export const upsertProfile =
  ({ prisma, publishEvent }: Dependencies) =>
  async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: unknown;
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;

    try {
      // Validate request body
      const profileData = validateProfile(request.body);

      // Check if profile exists
      const existingProfile = await profileRepo.getProfileByUserId(prisma, userId);

      if (existingProfile) {
        // Update existing profile
        const updatedProfile = await profileRepo.updateProfile(prisma, userId, profileData);
        await publishEvent(EVENTS.PROFILE_UPDATED, {
          userId,
          updates: profileData,
          timestamp: new Date(),
        });
        reply.send(updatedProfile);
      } else {
        // Create new profile
        const newProfile = await profileRepo.createProfile(prisma, userId, profileData);
        await publishEvent(EVENTS.PROFILE_CREATED, {
          userId,
          occupation: profileData.occupation,
          timestamp: new Date(),
        });
        reply.code(201).send(newProfile);
      }
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
        });
      } else {
        throw error;
      }
    }
  };

// Update profile
export const updateProfile =
  ({ prisma, publishEvent }: Dependencies) =>
  async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: unknown;
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;

    try {
      // Validate request body
      const updates = validatePartialProfile(request.body);

      // Update profile
      const updatedProfile = await profileRepo.updateProfile(prisma, userId, updates);
      await publishEvent(EVENTS.PROFILE_UPDATED, {
        userId,
        updates,
        timestamp: new Date(),
      });

      reply.send(updatedProfile);
    } catch (error) {
      if (error instanceof Error) {
        reply.code(400).send({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
        });
      } else {
        throw error;
      }
    }
  };

// Delete profile
export const deleteProfile =
  ({ prisma, publishEvent }: Dependencies) =>
  async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;

    try {
      await profileRepo.deleteProfile(prisma, userId);
      await publishEvent(EVENTS.PROFILE_DELETED, {
        userId,
        timestamp: new Date(),
      });

      reply.code(204).send();
    } catch (error) {
      if (error instanceof Error) {
        reply.code(404).send({
          code: ERROR_CODES.NOT_FOUND,
          message: 'Profile not found',
        });
      } else {
        throw error;
      }
    }
  };

// List profiles with pagination
export const listProfiles =
  ({ prisma }: Dependencies) =>
  async (
    request: FastifyRequest<{
      Querystring: {
        page?: number;
        limit?: number;
      };
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const skip = (page - 1) * limit;

    const profiles = await profileRepo.getProfiles(prisma, skip, limit);
    reply.send(profiles);
  };
