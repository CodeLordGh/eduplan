# User Role Access Documentation

## Overview
This document outlines the permissions and access controls for different user roles in the EduFlow system. Each role has specific capabilities and restrictions designed to maintain security and operational efficiency.

## Role Definitions

### 1. System Admin
```typescript
interface SystemAdminPermissions {
  schoolRegistration: {
    register: true
    fields: [
      'schoolAddress',
      'ownerInformation',
      'subjects',
      'availableClasses'
    ]
  }
  
  dataAccess: {
    allSchools: {
      access: 'VIEW_ONLY'
      scope: 'FULL'
    }
  }
  
  monitoring: {
    systemHealth: true
    sentryAccess: true
    metrics: string[]
  }
}
```

### 2. School Owner
```typescript
interface SchoolOwnerPermissions {
  staffManagement: {
    createAccounts: ['SCHOOL_HEAD', 'SCHOOL_ADMIN']
    employExisting: ['SCHOOL_HEAD', 'SCHOOL_ADMIN']
    conditions: {
      ownershipPercentage: '>=50%' | 'DECISION_MAKER'
    }
  }
  
  analytics: {
    view: [
      'ACTIVITIES',
      'PERFORMANCE_METRICS',
      'REVENUE',
      'PROFIT',
      'COMPARISONS'
    ]
    scope: 'OWNED_SCHOOLS'
  }
  
  socialPlatforms: {
    theHub: {
      view: true
      post: true
      interact: true
    }
    bHub: {
      view: true
      post: true
      interact: true
      businessProposals: true
      shareTrading: true
    }
  }
}
```

### 3. School Head
```typescript
interface SchoolHeadPermissions {
  staffing: {
    searchTeachers: true
    viewProfiles: true
    sendInterviewRequests: true
    reviewApplications: true
  }
  
  monitoring: {
    schoolActivities: true
    attendance: {
      teachers: true
      students: true
    }
    payments: [
      'SCHOOL_FEES',
      'BOOK_FEES',
      'FEEDING_FEES'
    ]
  }
  
  approvals: {
    employmentRequests: {
      review: true
      setSalary: true
      approve: true
      reject: true
    }
    newStudents: true
  }
  
  reports: {
    generateEndOfTerm: true
  }
}
```

### 4. School Admin
```typescript
interface SchoolAdminPermissions {
  registration: {
    processEmploymentTokens: {
      validate: true
      assignClasses: true
      assignSubjects: true
      submitForApproval: true
    }
    newUsers: [
      'STUDENTS',
      'COOKS',
      'ACCOUNTANT',
      'GATEMAN'
    ]
  }
  
  employmentTokens: {
    generate: true
    roles: [
      'TEACHERS',
      'COOKS',
      'ACCOUNTANT',
      'GATEMAN'
    ]
    config: {
      validity: '2 hours'
      oneTimeUse: true
      schoolSpecific: true
    }
  }
  
  schoolManagement: {
    timetable: {
      create: true
      modify: true
    }
    lessonPeriods: {
      setup: true
      modify: true
    }
    teacherAssignment: {
      subjects: true
      classes: true
    }
    calendar: {
      events: [
        'HOLIDAYS',
        'EXAMS',
        'MOCKS',
        'ACTIVITIES'
      ]
    }
  }
}
```

### 5. Accountant
```typescript
interface AccountantPermissions {
  feeCollection: {
    types: [
      'FEEDING_FEES',
      'SCHOOL_FEES',
      'BOOK_FEES',
      'MISCELLANEOUS'
    ]
  }
  
  inventory: {
    books: {
      confirmDelivery: true
      trackSales: true
    }
  }
}
```

### 6. Gateman
```typescript
interface GatemanPermissions {
  access: {
    studentProfiles: {
      view: true
      scope: ['AUTHORIZED_GUARDIANS']
    }
  }
  
  security: {
    validatePickup: true
    trackEntry: true
    trackExit: true
  }
}
```

### 7. Cook
```typescript
interface CookPermissions {
  profile: {
    visible: true
    scope: 'STAFF_MANAGEMENT'
  }
}
```

### 8. Teacher
```typescript
interface TeacherPermissions {
  employment: {
    generateToken: {
      requiresInterviewAcceptance: true
      validity: '2 hours'
      oneTimeUse: true
    }
    viewInterviewRequests: true
    viewSchoolProfiles: true
    acceptDeclineInterviews: true
  }
  
  studentData: {
    access: {
      scope: 'ASSIGNED_CLASSES_AND_SUBJECTS'
      timeLimit: '48_HOURS'  // For updates
      history: 'FULL'        // For viewing
    }
  }
  
  assessments: {
    record: [
      'EXAM_SCORES',
      'CLASS_WORK',
      'HOME_WORK'
    ]
  }
  
  socialFeatures: {
    theHub: {
      post: true
      interact: true
    }
    jobProposals: {
      receive: true
      accept: true
    }
  }
  
  tutoring: {
    setAvailability: true
    manageRequests: true
  }
  
  quizzes: {
    create: true
    monetization: true
  }
  
  employmentToken: {
    generate: true
    config: {
      validity: '2 hours'
      oneTimeUse: true
      schoolSpecific: true
    }
    restrictions: {
      maxActiveTokens: 3
      schoolsPerDay: 5
      cooldownPeriod: '24 hours'
    }
  }
}
```

### 9. Parent
```typescript
interface ParentPermissions {
  payments: {
    method: 'MOBILE_MONEY'
    types: [
      'SCHOOL_FEES',
      'FEEDING_FEES',
      'BOOK_FEES',
      'QUIZ_FEES'
    ]
  }
  
  monitoring: {
    childrenPerformance: true
  }
  
  tutoring: {
    browseTeachers: true
    viewProfiles: true
    sendProposals: true
  }
  
  quizControl: {
    enableForChild: true
    disableForChild: true
  }
}
```

### 10. Student
```typescript
interface StudentPermissions {
  academics: {
    homework: {
      view: true
      submit: true
    }
    games: {
      access: true
      parentalControl: true
    }
    quizzes: {
      access: 'PARENT_APPROVED'
      payment: 'PER_QUIZ'
    }
  }
}
```

## Access Control Matrix

| Feature                | System Admin | School Owner | School Head | School Admin | Teacher | Parent | Student |
|-----------------------|--------------|--------------|-------------|--------------|---------|---------|----------|
| School Registration    | Full        | -           | -           | -            | -       | -       | -        |
| Staff Management      | View         | Full        | Approve     | Register     | -       | -       | -        |
| Performance Analytics | Full         | Owned Schools| School      | School       | Class   | Child   | Self     |
| Financial Management  | View         | Full        | Monitor     | -            | -       | Pay     | -        |
| Academic Management   | -            | -           | Full        | Setup        | Teach   | Monitor | Participate|
| Social Platform Access| Monitor      | Full        | Basic       | Basic        | Basic   | Basic   | -        |

## See Also
- [New User Flow](./registration/new-user-flow.md)
- [School Registration](./registration/overview.md)
- [Error Handling](./registration/error-handling.md)