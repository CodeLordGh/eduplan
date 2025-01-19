import { z } from 'zod';
import { SYSTEM_OCCUPATIONS } from '../utils/constants';

// Validation regex patterns
const NAME_PATTERN = /^[a-zA-Z\s-]{2,50}$/;
const OCCUPATION_PATTERN = /^[a-zA-Z\s-]{2,100}$/;

// Base profile schema
export const profileSchema = z.object({
  firstName: z.string().regex(NAME_PATTERN, 'Invalid first name format'),
  lastName: z.string().regex(NAME_PATTERN, 'Invalid last name format'),
  contact: z.object({
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      postalCode: z.string()
    }).optional()
  }),
  occupation: z.string().regex(OCCUPATION_PATTERN, 'Invalid occupation format'),
  metadata: z.record(z.unknown()).optional()
});

// Type inference
export type ProfileInput = z.infer<typeof profileSchema>;

// Validation functions
export const validateProfile = (profile: unknown): ProfileInput => 
  profileSchema.parse(profile);

export const validateOccupation = (occupation: string, role: string): boolean => {
  // For system roles, occupation must match predefined values
  if (Object.keys(SYSTEM_OCCUPATIONS).includes(role)) {
    return occupation === SYSTEM_OCCUPATIONS[role as keyof typeof SYSTEM_OCCUPATIONS];
  }
  
  // For user-provided roles (PARENT, SCHOOL_OWNER)
  return OCCUPATION_PATTERN.test(occupation);
};

// Partial profile validation for updates
export const validatePartialProfile = (profile: unknown): Partial<ProfileInput> =>
  profileSchema.partial().parse(profile); 