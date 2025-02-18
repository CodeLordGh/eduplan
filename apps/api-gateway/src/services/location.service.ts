import { createAppError } from '@eduflow/common';
import type { UserContext } from '@eduflow/types';
import { redis } from '../config/redis';

const CACHE_TTL = 24 * 60 * 60; // 24 hours
const CACHE_PREFIX = 'ip_location:';

interface IPLocation {
  ip: string;
  country: string;
  region: string;
}

// Get location from IP with caching
export const getLocationFromIP = async (ip: string): Promise<UserContext['location']> => {
  try {
    // Try to get from cache first
    const cached = await redis.get(`${CACHE_PREFIX}${ip}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get location from IP service (implement your preferred service)
    const location = await fetchLocationFromIP(ip);

    // Cache the location
    await redis.set(`${CACHE_PREFIX}${ip}`, JSON.stringify(location), 'EX', CACHE_TTL);

    return location;
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    // Return a default location on error
    return {
      ip,
      country: 'UNKNOWN',
      region: 'UNKNOWN',
    };
  }
};

// Fetch location from IP service
const fetchLocationFromIP = async (ip: string): Promise<IPLocation> => {
  try {
    // Implement your preferred IP geolocation service
    // Example using a mock service
    return {
      ip,
      country: 'GH', // Ghana
      region: 'Greater Accra',
    };
  } catch (error) {
    throw createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch location from IP',
      cause: error instanceof Error ? error : undefined
    });
  }
};
