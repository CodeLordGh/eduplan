# User Service Development Plan

## Service Overview
The User Service manages user profiles, relationships, and professional history. It handles user data management and relationships between different user types in the system.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, ValidationUtils } from '@eduflow/common'

// From @eduflow/types
import { Profile, UserRelation, RelationType, ProfileMetadata } from '@eduflow/types'

// From @eduflow/validators
import { validateProfile, validateRelation } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { RELATION_TYPES, PROFILE_TYPES } from '@eduflow/constants'
```

### External Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/swagger": "^8.8.0",
    "zod": "^3.22.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0",
    "cloudinary": "^1.40.0",
    "@fastify/multipart": "^7.7.3"
  },
  "devDependencies": {
    "prisma": "^5.2.0",
    "jest": "^29.6.4",
    "typescript": "^5.2.2"
  }
}
```

## Database Schema (Prisma)
```prisma
model Profile {
  id        String    @id @default(uuid())
  userId    String    @unique
  firstName String
  lastName  String
  contact   Json      // Phone, address, etc.
  occupation String   // Added occupation field
  metadata  Json      // Additional profile data
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("profiles")
}

model UserRelationship {
  id            String       @id @default(uuid())
  userId        String
  relatedUserId String
  type          RelationType
  metadata      Json?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([userId, relatedUserId, type])
  @@map("user_relationships")
}

model ProfessionalProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  experience    Json[]   // Array of work experiences
  certifications Json[]  // Array of certifications
  skills        String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("professional_profiles")
}

model SchoolOwnerProfile {
  id          String    @id @default(uuid())
  userId      String    @unique
  schools     String[]  // Array of school IDs
  status      VerificationStatus
  verifiedAt  DateTime?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("school_owner_profiles")
}

model StudentProfile {
  id            String    @id @default(uuid())
  userId        String    @unique
  parentId      String    // Reference to parent/guardian user
  currentSchoolId String?
  dateOfBirth   DateTime
  gender        String
  address       Json
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("student_profiles")
}

model StudentSchoolHistory {
  id            String    @id @default(uuid())
  studentId     String
  schoolId      String
  startDate     DateTime
  endDate       DateTime?
  grade         String
  transferReason String?  // Required when transferring out
  status        String    // ACTIVE, TRANSFERRED_OUT, GRADUATED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("student_school_history")
}

model ParentProfile {
  id            String    @id @default(uuid())
  userId        String    @unique
  relationship  String    // FATHER, MOTHER, GUARDIAN
  occupation    String?
  workAddress   Json?
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("parent_profiles")
}

model ParentStudentRelation {
  id            String    @id @default(uuid())
  parentId      String
  studentId     String
  relationship  String
  isEmergencyContact Boolean @default(false)
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([parentId, studentId])
  @@map("parent_student_relations")
}

model TeacherProfile {
  id            String    @id @default(uuid())
  userId        String    @unique
  specialization String[]
  qualifications Json[]   // Degrees, certifications, etc.
  yearsOfExperience Int
  subjects      String[]
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("teacher_profiles")
}

model TeacherEmployment {
  id            String    @id @default(uuid())
  teacherId     String
  schoolId      String
  type          EmploymentType  // FULL_TIME, PART_TIME
  status        EmploymentStatus // ACTIVE, RESIGNED, TERMINATED
  startDate     DateTime
  endDate       DateTime?
  exitReason    String?    // Required when leaving
  contractDetails Json?
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("teacher_employments")
}

model TeacherEmploymentHistory {
  id            String    @id @default(uuid())
  teacherId     String
  schoolId      String
  type          EmploymentType
  startDate     DateTime
  endDate       DateTime
  exitReason    String
  performance   Json?     // Performance metrics
  metadata      Json?
  createdAt     DateTime  @default(now())

  @@map("teacher_employment_history")
}
```

## Event System

### Events Published
```typescript
type UserEvents = {
  PROFILE_UPDATED: {
    userId: string
    updates: Partial<Profile>
    timestamp: Date
  }
  USER_ASSIGNED_TO_SCHOOL: {
    userId: string
    schoolId: string
    role: string
    timestamp: Date
  }
  USER_REMOVED_FROM_SCHOOL: {
    userId: string
    schoolId: string
    timestamp: Date
  }
  SCHOOL_OWNER_PROFILE_CREATED: {
    userId: string
    schoolId: string
    timestamp: Date
  }
  SCHOOL_OWNER_PROFILE_UPDATED: {
    userId: string
    updates: Partial<SchoolOwnerProfile>
    timestamp: Date
  }
  STUDENT_PROFILE_CREATED: {
    userId: string
    parentId: string
    schoolId: string
    timestamp: Date
  }
  STUDENT_TRANSFERRED: {
    userId: string
    fromSchoolId: string
    toSchoolId: string
    reason: string
    timestamp: Date
  }
  PARENT_PROFILE_CREATED: {
    userId: string
    timestamp: Date
  }
  STUDENT_PARENT_LINKED: {
    studentId: string
    parentId: string
    relationship: string
    timestamp: Date
  }
  TEACHER_PROFILE_CREATED: {
    userId: string
    timestamp: Date
  }
  TEACHER_EMPLOYED: {
    userId: string
    schoolId: string
    employmentType: EmploymentType
    timestamp: Date
  }
  TEACHER_EMPLOYMENT_ENDED: {
    userId: string
    schoolId: string
    reason: string
    timestamp: Date
  }
  TEACHER_EMPLOYMENT_LIMIT_REACHED: {
    userId: string
    schoolId: string
    timestamp: Date
  }
  PROFILE_CREATED: {
    userId: string
    occupation: string
    timestamp: Date
  }
}
```

### Events Consumed
```typescript
type ConsumedEvents = {
  USER_CREATED: {
    userId: string
    email: string
    role: string
  }
  USER_DELETED: {
    userId: string
  }
  SCHOOL_CREATED: {
    schoolId: string
    name: string
    type: string
  }
  KYC_VERIFIED: {
    userId: string
    documentType: string
  }
  KYC_REJECTED: {
    userId: string
    reason: string
  }
  SCHOOL_OWNER_LINKED: {
    schoolId: string
    ownerId: string
    ownershipType: string
  }
  SCHOOL_OWNER_CREATION_REQUESTED: {
    requestId: string
    schoolId: string
    ownerData: object
  }
  PARENT_OTP_VERIFIED: {
    userId: string
    otpId: string
    purpose: string
    schoolId: string
  }
  STUDENT_OTP_VERIFIED: {
    userId: string
    otpId: string
    purpose: string
    schoolId: string
  }
  TEACHER_OTP_VERIFIED: {
    userId: string
    otpId: string
    purpose: string
    schoolId: string
  }
}
```

## API Endpoints

### Profile Management
```typescript
// GET /users/:userId/profile
type GetProfileResponse = Profile & {
  professional?: ProfessionalProfile
}

// PUT /users/:userId/profile
type UpdateProfileRequest = Partial<Profile>

// POST /users/:userId/profile/photo
type UploadPhotoRequest = {
  photo: File
}
```

### Relationship Management
```typescript
// POST /users/:userId/relationships
type CreateRelationshipRequest = {
  relatedUserId: string
  type: RelationType
  metadata?: Record<string, unknown>
}

// GET /users/:userId/relationships
type GetRelationshipsResponse = {
  relationships: UserRelationship[]
}
```

### School Owner Profile Management
```typescript
// GET /users/:userId/owner-profile
type GetOwnerProfileResponse = SchoolOwnerProfile & {
  schools: School[]
}

// PUT /users/:userId/owner-profile
type UpdateOwnerProfileRequest = Partial<SchoolOwnerProfile>

// GET /users/:userId/owned-schools
type GetOwnedSchoolsResponse = {
  schools: School[]
  total: number
}
```

### Student Management
```typescript
// POST /students/register
type RegisterStudentRequest = {
  student: {
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: string
    address: Address
    metadata?: Record<string, unknown>
  }
  parent: {
    type: 'NEW_ACCOUNT' | 'EXISTING_ACCOUNT'
    otpCode?: string
    personalInfo?: {
      email: string
      firstName: string
      lastName: string
      relationship: string
      occupation: string  // Required for parents
      workAddress?: Address
    }
  }
  schoolId: string
  grade: string
}

// POST /students/transfer
type TransferStudentRequest = {
  studentId: string
  fromSchoolId: string
  toSchoolId: string
  grade: string
  reason: string
  otpCode: string // Parent's OTP for authorization
  metadata?: Record<string, unknown>
}

// GET /students/:studentId/history
type GetStudentHistoryResponse = {
  currentSchool: School
  history: StudentSchoolHistory[]
}
```

### Parent Management
```typescript
// GET /parents/:parentId/students
type GetParentStudentsResponse = {
  students: Array<{
    profile: StudentProfile
    currentSchool: School
    relationship: string
  }>
}

// POST /parents/otp/generate
type GenerateParentOTPRequest = {
  purpose: 'STUDENT_REGISTRATION' | 'STUDENT_TRANSFER'
  schoolId: string
}
```

### Teacher Management
```typescript
// POST /teachers/register
type RegisterTeacherRequest = {
  teacher: {
    firstName: string
    lastName: string
    email: string
    specialization: string[]
    qualifications: {
      degree: string
      institution: string
      year: number
    }[]
    subjects: string[]
    metadata?: Record<string, unknown>
    // occupation will be auto-filled as "Teacher"
  }
  employment: {
    type: EmploymentType
    startDate: Date
    contractDetails?: Record<string, unknown>
  }
  schoolId: string
}

// POST /teachers/employment/end
type EndEmploymentRequest = {
  teacherId: string
  schoolId: string
  endDate: Date
  reason: string
  metadata?: Record<string, unknown>
}

// GET /teachers/:teacherId/employments
type GetTeacherEmploymentsResponse = {
  current: {
    fullTime?: TeacherEmployment
    partTime: TeacherEmployment[]
  }
  history: TeacherEmploymentHistory[]
}

// GET /teachers/:teacherId/availability
type CheckTeacherAvailabilityResponse = {
  canBeEmployed: boolean
  currentEmployments: {
    fullTime?: {
      schoolId: string
      startDate: Date
    }
    partTime: Array<{
      schoolId: string
      startDate: Date
    }>
  }
  partTimeSlotAvailable: boolean
}
```

## Implementation Plan

### Phase 1: Core Profile Management
1. Basic profile CRUD operations
2. Profile photo management
3. Contact information handling
4. Profile validation rules
5. Occupation management
   - Auto-fill occupation for system roles:
     * Headmaster -> "Headmaster"
     * School Admin -> "School Administrator"
     * Teacher -> "Teacher"
     * Student -> "Student"
   - Validate occupation for user-provided roles:
     * Parent
     * School Owner

### Phase 2: Relationship System
1. Relationship creation/deletion
2. Relationship type validation
3. Bidirectional relationship handling
4. Relationship metadata management

### Phase 3: Professional Profiles
1. Professional history tracking
2. Certification management
3. Skills management
4. Experience validation

### Phase 4: Integration Features
1. School assignment handling
2. KYC status integration
3. Event system integration
4. Search and filtering

### Phase 5: School Owner Management
1. School owner profile creation
2. School ownership verification
3. Multi-school ownership handling
4. Owner profile validation

### Phase 6: Student Management
1. Student registration flow
2. Parent-student linking
3. School history tracking
4. Transfer management

### Phase 7: Teacher Management
1. Teacher profile creation
2. Employment type validation
3. Multi-school employment limits
4. Employment history tracking
5. Availability checking

## Testing Strategy

### Unit Tests
```typescript
// Profile service tests
describe('ProfileService', () => {
  test('should create profile for new user')
  test('should update profile fields')
  test('should handle profile photo upload')
  test('should auto-fill occupation for system roles')
  test('should validate occupation for user-provided roles')
})

// Add occupation validation tests
describe('OccupationValidationService', () => {
  test('should auto-fill headmaster occupation')
  test('should auto-fill school admin occupation')
  test('should auto-fill teacher occupation')
  test('should auto-fill student occupation')
  test('should require occupation for parent registration')
  test('should require occupation for school owner registration')
  test('should validate occupation format')
})

// Relationship service tests
describe('RelationshipService', () => {
  test('should create bidirectional relationships')
  test('should validate relationship types')
  test('should prevent duplicate relationships')
})

// School owner profile tests
describe('SchoolOwnerProfileService', () => {
  test('should create owner profile')
  test('should update owner profile')
  test('should handle multiple schools')
  test('should validate ownership')
})

// Student management tests
describe('StudentService', () => {
  test('should register new student')
  test('should link with parent')
  test('should track school history')
  test('should handle transfers')
})

// Parent management tests
describe('ParentService', () => {
  test('should create parent profile')
  test('should link multiple students')
  test('should validate relationships')
})

// Teacher management tests
describe('TeacherService', () => {
  test('should create teacher profile')
  test('should validate employment type')
  test('should enforce employment limits')
  test('should track employment history')
})

// Employment validation tests
describe('EmploymentValidationService', () => {
  test('should check full-time availability')
  test('should validate part-time limits')
  test('should handle employment transitions')
})
```

### Integration Tests
```typescript
describe('User API', () => {
  test('should manage profile data')
  test('should handle relationship creation')
  test('should integrate with school system')
  test('should handle file uploads')
})

describe('School Owner Profile API', () => {
  test('should manage owner profiles')
  test('should handle school assignments')
  test('should track verification status')
})

describe('Student Registration API', () => {
  test('should register with new parent')
  test('should register with existing parent')
  test('should handle student transfer')
})

describe('Teacher Management API', () => {
  test('should register new teacher')
  test('should handle existing teacher')
  test('should manage employment lifecycle')
  test('should enforce business rules')
})
```

## Monitoring & Logging

### Metrics
- Profile update frequency
- Relationship creation rate
- Photo upload success rate
- API endpoint usage
- Error rates by type
- School owner creation rate
- Ownership verification rate
- Multi-school ownership stats

### Logging
```typescript
const logger = createLogger({
  service: 'user-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Data Validation Rules
1. Name format validation
2. Contact information format
3. Professional history timeline consistency
4. Relationship type constraints
5. File upload restrictions
6. Employment type constraints
7. Part-time school limit (max 4)
8. Employment transition rules
9. Occupation validation rules:
   - System roles: Auto-filled, read-only
   - User-provided roles: Required, non-empty string
   - Maximum length: 100 characters
   - No special characters except spaces and hyphens

## Service Implementation

```typescript
// Add occupation constants
const SYSTEM_OCCUPATIONS = {
  HEADMASTER: 'Headmaster',
  SCHOOL_ADMIN: 'School Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student'
} as const;

// Add occupation validation
const validateOccupation = (occupation: string): boolean => {
  if (!occupation || occupation.trim().length === 0) return false;
  if (occupation.length > 100) return false;
  return /^[a-zA-Z\s\-]+$/.test(occupation);
};

// Add occupation handling to profile creation
class ProfileService {
  async createProfile(userId: string, role: string, data: CreateProfileData): Promise<Profile> {
    const occupation = this.determineOccupation(role, data.occupation);
    
    // Validate occupation if user-provided
    if (!Object.values(SYSTEM_OCCUPATIONS).includes(occupation as any)) {
      if (!validateOccupation(occupation)) {
        throw new ValidationError('Invalid occupation format');
      }
    }

    return await this.prisma.profile.create({
      data: {
        userId,
        occupation,
        ...data
      }
    });
  }

  private determineOccupation(role: string, providedOccupation?: string): string {
    switch (role) {
      case 'HEADMASTER':
        return SYSTEM_OCCUPATIONS.HEADMASTER;
      case 'SCHOOL_ADMIN':
        return SYSTEM_OCCUPATIONS.SCHOOL_ADMIN;
      case 'TEACHER':
        return SYSTEM_OCCUPATIONS.TEACHER;
      case 'STUDENT':
        return SYSTEM_OCCUPATIONS.STUDENT;
      case 'PARENT':
      case 'SCHOOL_OWNER':
        if (!providedOccupation) {
          throw new ValidationError('Occupation is required');
        }
        return providedOccupation;
      default:
        throw new ValidationError('Invalid role');
    }
  }
}
``` 