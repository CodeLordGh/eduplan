# Class Setup Documentation

## Standard Class Definitions

### 1. Educational Levels
```typescript
enum EducationalLevel {
  PRE_SCHOOL = 'PRE_SCHOOL',
  PRIMARY = 'PRIMARY',
  JUNIOR_HIGH = 'JUNIOR_HIGH',
  SENIOR_HIGH = 'SENIOR_HIGH'
}

interface StandardClassDefinition {
  level: EducationalLevel
  classLevel: string
  description: string
  defaultCapacity: number
  ageRange: {
    min: number
    max: number
  }
}
```

### 2. Predefined Classes
```typescript
const StandardClasses: StandardClassDefinition[] = [
  // Pre-School Classes
  {
    level: EducationalLevel.PRE_SCHOOL,
    classLevel: 'CRECHE',
    description: 'Early childhood care (Ages 1-2)',
    defaultCapacity: 15,
    ageRange: { min: 1, max: 2 }
  },
  {
    level: EducationalLevel.PRE_SCHOOL,
    classLevel: 'KG1',
    description: 'Kindergarten First Year (Ages 3-4)',
    defaultCapacity: 20,
    ageRange: { min: 3, max: 4 }
  },
  {
    level: EducationalLevel.PRE_SCHOOL,
    classLevel: 'KG2',
    description: 'Kindergarten Second Year (Ages 4-5)',
    defaultCapacity: 20,
    ageRange: { min: 4, max: 5 }
  },
  
  // Primary School Classes
  {
    level: EducationalLevel.PRIMARY,
    classLevel: 'PRIMARY1',
    description: 'Primary School First Year (Ages 5-6)',
    defaultCapacity: 30,
    ageRange: { min: 5, max: 6 }
  },
  // ... PRIMARY2 through PRIMARY5 follow same pattern
  {
    level: EducationalLevel.PRIMARY,
    classLevel: 'PRIMARY6',
    description: 'Primary School Final Year (Ages 10-11)',
    defaultCapacity: 30,
    ageRange: { min: 10, max: 11 }
  },
  
  // Junior High School Classes
  {
    level: EducationalLevel.JUNIOR_HIGH,
    classLevel: 'JHS1',
    description: 'Junior High First Year (Ages 11-12)',
    defaultCapacity: 35,
    ageRange: { min: 11, max: 12 }
  },
  {
    level: EducationalLevel.JUNIOR_HIGH,
    classLevel: 'JHS2',
    description: 'Junior High Second Year (Ages 12-13)',
    defaultCapacity: 35,
    ageRange: { min: 12, max: 13 }
  },
  {
    level: EducationalLevel.JUNIOR_HIGH,
    classLevel: 'JHS3',
    description: 'Junior High Final Year (Ages 13-14)',
    defaultCapacity: 35,
    ageRange: { min: 13, max: 14 }
  },
  
  // Senior High School Classes
  {
    level: EducationalLevel.SENIOR_HIGH,
    classLevel: 'SHS1',
    description: 'Senior High First Year (Ages 14-15)',
    defaultCapacity: 40,
    ageRange: { min: 14, max: 15 }
  },
  {
    level: EducationalLevel.SENIOR_HIGH,
    classLevel: 'SHS2',
    description: 'Senior High Second Year (Ages 15-16)',
    defaultCapacity: 40,
    ageRange: { min: 15, max: 16 }
  },
  {
    level: EducationalLevel.SENIOR_HIGH,
    classLevel: 'SHS3',
    description: 'Senior High Final Year (Ages 16-17)',
    defaultCapacity: 40,
    ageRange: { min: 16, max: 17 }
  }
]
```

## Class Section Management

### 1. Section Configuration
```typescript
interface SectionConfig {
  naming: {
    pattern: string  // e.g., "{CLASS_LEVEL}{SECTION_LETTER}"
    startLetter: string  // typically 'A'
    maxSections: number
  }
  
  capacity: {
    min: number
    max: number
    adjustmentRules: {
      allowOverflow: boolean
      overflowPercentage: number
      underflowThreshold: number
    }
  }
}
```

### 2. Section Creation
```typescript
interface SectionCreation {
  validation: {
    checkCapacity: boolean
    checkTeacherAssignment: boolean
    checkResourceAvailability: boolean
  }
  
  constraints: {
    maxStudentsPerTeacher: number
    requiredResources: string[]
    minimumFacilities: string[]
  }
  
  workflow: {
    steps: [
      'VALIDATE_REQUIREMENTS',
      'CREATE_SECTION',
      'ASSIGN_RESOURCES',
      'NOTIFY_ADMIN'
    ]
  }
}
```

## Class Availability Management

### 1. School Class Configuration
```typescript
interface SchoolClassConfig {
  levels: EducationalLevel[]
  customizations: {
    capacityOverrides: Record<string, number>
    sectionOverrides: Record<string, number>
    specialRequirements: Record<string, string[]>
  }
  
  scheduling: {
    academicYear: string
    terms: number
    classesPerTerm: number
  }
}
```

### 2. Availability Rules
```typescript
interface AvailabilityRules {
  activation: {
    requiresApproval: boolean
    automaticDeactivation: boolean
    notificationRecipients: string[]
  }
  
  constraints: {
    minEnrollment: number
    maxEnrollment: number
    waitlistSize: number
    closureConditions: string[]
  }
  
  modifications: {
    allowCapacityAdjustment: boolean
    allowSectionAddition: boolean
    approvalRequired: boolean
  }
}
```

## Resource Management

### 1. Class Resources
```typescript
interface ClassResources {
  physical: {
    classroom: {
      size: number  // square meters
      capacity: number
      facilities: string[]
    }
    equipment: {
      required: string[]
      optional: string[]
      quantity: Record<string, number>
    }
  }
  
  staff: {
    teachers: {
      required: number
      qualifications: string[]
      specializations: string[]
    }
    assistants: {
      required: number
      qualifications: string[]
    }
  }
}
```

### 2. Resource Allocation
```typescript
interface ResourceAllocation {
  strategy: {
    type: 'FIXED' | 'DYNAMIC'
    priority: number
    sharingAllowed: boolean
  }
  
  scheduling: {
    timeSlots: string[]
    rotationPolicy: string
    conflictResolution: string[]
  }
  
  monitoring: {
    utilizationTracking: boolean
    maintenanceSchedule: string
    replacementTriggers: string[]
  }
}
```

## Validation & Compliance

### 1. Class Setup Validation
```typescript
interface ClassSetupValidation {
  requirements: {
    physical: string[]
    staffing: string[]
    regulatory: string[]
  }
  
  checks: {
    safety: string[]
    accessibility: string[]
    facilities: string[]
  }
  
  documentation: {
    required: string[]
    format: string
    retention: string
  }
}
```

### 2. Compliance Rules
```typescript
interface ComplianceRules {
  educational: {
    curriculumStandards: string[]
    teachingQualifications: string[]
    assessmentRequirements: string[]
  }
  
  safety: {
    studentTeacherRatio: number
    emergencyProcedures: string[]
    healthRequirements: string[]
  }
  
  reporting: {
    frequency: string
    metrics: string[]
    authorities: string[]
  }
}
```

## See Also
- [New User Flow](./new-user-flow.md)
- [Error Handling Guide](./error-handling.md)
- [Progress Tracking](./progress-tracking.md) 