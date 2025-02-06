# School Service Development Plan

## Service Overview
The School Service manages school entities, departments, classes, and staff assignments. It handles the organizational structure of educational institutions within the system.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, ValidationUtils } from '@eduflow/common'

// From @eduflow/types
import { School, Class, StaffAssignment, SchoolType } from '@eduflow/types'

// From @eduflow/validators
import { validateSchool, validateClass } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, schoolGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { SCHOOL_TYPES, STAFF_ROLES } from '@eduflow/constants'
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
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2"
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
model School {
  id          String   @id @default(uuid())
  name        String
  type        SchoolType
  status      SchoolStatus
  settings    Json
  metadata    Json?
  ownerId     String?
  ownershipType String    // NEW_ACCOUNT or EXISTING_ACCOUNT
  ownerVerificationStatus VerificationStatus
  ownershipMetadata Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("schools")
}

model Department {
  id        String   @id @default(uuid())
  schoolId  String
  name      String
  headId    String?  // User ID of department head
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([schoolId, name])
  @@map("departments")
}

model Class {
  id           String   @id @default(uuid())
  schoolId     String
  departmentId String?
  name         String
  grade        String
  academicYear String
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([schoolId, name, academicYear])
  @@map("classes")
}

model StaffAssignment {
  id        String       @id @default(uuid())
  schoolId  String
  userId    String
  role      StaffRole
  status    StaffStatus
  startDate DateTime
  endDate   DateTime?
  metadata  Json?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([schoolId, userId, role])
  @@map("staff_assignments")
}

model SchoolOwnerRequest {
  id          String    @id @default(uuid())
  schoolId    String
  ownerData   Json?     // For new account creation
  otpCode     String?   // For existing account linking
  status      String    // PENDING, APPROVED, REJECTED
  createdBy   String    // system admin id
  processedAt DateTime?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("school_owner_requests")
}

model StudentEnrollment {
  id            String    @id @default(uuid())
  schoolId      String
  studentId     String
  grade         String
  status        EnrollmentStatus  // ACTIVE, TRANSFERRED_OUT, GRADUATED
  enrolledAt    DateTime
  exitDate      DateTime?
  exitReason    String?    // Required for transfers
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, studentId])
  @@map("student_enrollments")
}

model StudentTransfer {
  id            String    @id @default(uuid())
  studentId     String
  fromSchoolId  String
  toSchoolId    String
  grade         String
  reason        String
  status        TransferStatus  // PENDING, APPROVED, REJECTED, COMPLETED
  requestedBy   String    // User ID who initiated
  approvedBy    String?   // User ID who approved
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("student_transfers")
}

model TeacherAssignment {
  id            String    @id @default(uuid())
  schoolId      String
  teacherId     String
  type          EmploymentType  // FULL_TIME, PART_TIME
  status        AssignmentStatus // PENDING, ACTIVE, ENDED
  startDate     DateTime
  endDate       DateTime?
  subjects      String[]
  classes       String[]  // Class IDs
  schedule      Json      // Teaching schedule
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  salary        Decimal?
  currency      String?
  salaryStatus  String?    // PENDING, APPROVED
  approvedBy    String?    // School head ID
  approvedAt    DateTime?

  @@unique([schoolId, teacherId])
  @@map("teacher_assignments")
}

model TeacherTransition {
  id            String    @id @default(uuid())
  teacherId     String
  fromSchoolId  String
  toSchoolId    String?
  type          TransitionType // RESIGNATION, TRANSFER
  reason        String
  effectiveDate DateTime
  status        TransitionStatus // PENDING, APPROVED, COMPLETED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("teacher_transitions")
}

model EmployeeSalary {
  id            String    @id @default(uuid())
  schoolId      String
  employeeId    String
  amount        Decimal
  currency      String
  type          SalaryType  // MONTHLY, HOURLY
  effectiveFrom DateTime
  effectiveTo   DateTime?
  status        SalaryStatus // PENDING, ACTIVE, ARCHIVED
  approvedBy    String    // School head ID
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("employee_salaries")
}

model EmployeeTermination {
  id            String    @id @default(uuid())
  schoolId      String
  employeeId    String
  terminatedBy  String    // User ID who terminated
  reason        String
  details       String
  effectiveDate DateTime
  type          TerminationType // RESIGNATION, FIRED, CONTRACT_END
  metadata      Json?
  createdAt     DateTime  @default(now())

  @@map("employee_terminations")
}

model SchoolPerformance {
  id            String    @id @default(uuid())
  schoolId      String
  period        String    // e.g., "2024-Q1"
  metrics       Json      // Academic, financial, staff metrics
  comparisons   Json?     // Comparative analysis
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("school_performances")
}

model PaymentTemplate {
  id            String    @id @default(uuid())
  schoolId      String
  name          String
  type          String    // TUITION, UNIFORM, BOOKS, etc.
  amount        Decimal
  currency      String
  description   String?
  dueDate       DateTime?
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, name])
  @@map("payment_templates")
}

model ReceiptTemplate {
  id            String    @id @default(uuid())
  schoolId      String
  name          String
  template      String    // HTML/JSON template
  logo          String?   // URL to school logo
  footer        String?
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, name])
  @@map("receipt_templates")
}

model Payment {
  id            String    @id @default(uuid())
  schoolId      String
  studentId     String
  parentId      String
  amount        Decimal
  currency      String
  type          String
  paymentDate   DateTime
  receiptNumber String    @unique
  description   String?
  status        PaymentStatus  // PENDING, COMPLETED, CANCELLED
  processedBy   String    // accountant ID
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("payments")
}

model AcademicYear {
  id            String    @id @default(uuid())
  schoolId      String
  name          String    // e.g., "2023-2024"
  startDate     DateTime
  endDate       DateTime
  terms         Term[]
  status        AcademicYearStatus  // UPCOMING, ACTIVE, COMPLETED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, name])
  @@map("academic_years")
}

model Term {
  id            String    @id @default(uuid())
  academicYearId String
  name          String    // e.g., "Term 1"
  startDate     DateTime
  endDate       DateTime
  status        TermStatus  // UPCOMING, ACTIVE, COMPLETED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([academicYearId, name])
  @@map("terms")
}

model Subject {
  id            String    @id @default(uuid())
  schoolId      String
  name          String
  code          String
  description   String?
  gradeLevel    String[]  // Which grades this subject is for
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, code])
  @@map("subjects")
}

model TeacherSubject {
  id            String    @id @default(uuid())
  schoolId      String
  teacherId     String
  subjectId     String
  academicYearId String
  status        AssignmentStatus
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, teacherId, subjectId, academicYearId])
  @@map("teacher_subjects")
}

model ClassSchedule {
  id            String    @id @default(uuid())
  schoolId      String
  classId       String
  academicYearId String
  schedule      Json      // Weekly schedule with periods
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, classId, academicYearId])
  @@map("class_schedules")
}

model ClassSubject {
  id            String    @id @default(uuid())
  schoolId      String
  classId       String
  subjectId     String
  teacherId     String
  academicYearId String
  schedule      Json      // When this subject is taught
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, classId, subjectId, academicYearId])
  @@map("class_subjects")
}

model StudentGrade {
  id            String    @id @default(uuid())
  schoolId      String
  studentId     String
  subjectId     String
  teacherId     String
  termId        String
  academicYearId String
  grade         Decimal
  remarks       String?
  status        GradeStatus  // DRAFT, SUBMITTED, APPROVED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, studentId, subjectId, termId])
  @@map("student_grades")
}

model ReportCard {
  id            String    @id @default(uuid())
  schoolId      String
  studentId     String
  termId        String
  academicYearId String
  grades        Json      // Compiled grades and statistics
  attendance    Json      // Attendance records
  remarks       Json      // Teacher and head remarks
  status        ReportStatus  // PENDING, COMPLETE, APPROVED
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([schoolId, studentId, termId])
  @@map("report_cards")
}
```

## Event System

### Events Published
```typescript
type SchoolEvents = {
  SCHOOL_CREATED: {
    schoolId: string
    name: string
    type: SchoolType
    timestamp: Date
  }
  SCHOOL_UPDATED: {
    schoolId: string
    updates: Partial<School>
    timestamp: Date
  }
  CLASS_CREATED: {
    classId: string
    schoolId: string
    name: string
    grade: string
    timestamp: Date
  }
  STAFF_ASSIGNED: {
    assignmentId: string
    schoolId: string
    userId: string
    role: StaffRole
    timestamp: Date
  }
  SCHOOL_OWNER_LINKED: {
    schoolId: string
    ownerId: string
    ownershipType: string
    timestamp: Date
  }
  SCHOOL_OWNER_CREATION_REQUESTED: {
    requestId: string
    schoolId: string
    ownerData: object
    timestamp: Date
  }
  STUDENT_ENROLLED: {
    studentId: string
    schoolId: string
    grade: string
    timestamp: Date
  }
  STUDENT_TRANSFER_REQUESTED: {
    transferId: string
    studentId: string
    fromSchoolId: string
    toSchoolId: string
    timestamp: Date
  }
  STUDENT_TRANSFER_COMPLETED: {
    transferId: string
    studentId: string
    fromSchoolId: string
    toSchoolId: string
    timestamp: Date
  }
  STUDENT_ACCESS_REVOKED: {
    studentId: string
    schoolId: string
    reason: string
    timestamp: Date
  }
  TEACHER_ASSIGNMENT_CREATED: {
    assignmentId: string
    schoolId: string
    teacherId: string
    type: EmploymentType
    timestamp: Date
  }
  TEACHER_ASSIGNMENT_ENDED: {
    assignmentId: string
    schoolId: string
    teacherId: string
    reason: string
    timestamp: Date
  }
  TEACHER_TRANSITION_REQUESTED: {
    transitionId: string
    teacherId: string
    fromSchoolId: string
    toSchoolId?: string
    type: TransitionType
    timestamp: Date
  }
  EMPLOYEE_SALARY_SET: {
    employeeId: string
    schoolId: string
    amount: number
    currency: string
    timestamp: Date
  }
  EMPLOYEE_ASSIGNMENT_PENDING: {
    assignmentId: string
    schoolId: string
    employeeId: string
    type: string
    timestamp: Date
  }
  EMPLOYEE_ASSIGNMENT_APPROVED: {
    assignmentId: string
    schoolId: string
    employeeId: string
    approvedBy: string
    timestamp: Date
  }
  EMPLOYEE_TERMINATED: {
    employeeId: string
    schoolId: string
    terminatedBy: string
    reason: string
    type: string
    timestamp: Date
  }
  SCHOOL_HEAD_ASSIGNED: {
    schoolId: string
    userId: string
    assignedBy: string
    timestamp: Date
  }
  SCHOOL_HEAD_REMOVED: {
    schoolId: string
    userId: string
    removedBy: string
    reason: string
    timestamp: Date
  }
  SCHOOL_ADMIN_ASSIGNED: {
    schoolId: string
    userId: string
    assignedBy: string
    timestamp: Date
  }
  SCHOOL_ADMIN_REMOVED: {
    schoolId: string
    userId: string
    removedBy: string
    reason: string
    timestamp: Date
  }
  SCHOOL_PERFORMANCE_UPDATED: {
    schoolId: string
    period: string
    timestamp: Date
  }
  PAYMENT_RECORDED: {
    paymentId: string
    schoolId: string
    studentId: string
    amount: number
    currency: string
    timestamp: Date
  }
  RECEIPT_GENERATED: {
    paymentId: string
    schoolId: string
    receiptNumber: string
    timestamp: Date
  }
  PAYMENT_TEMPLATE_UPDATED: {
    schoolId: string
    templateId: string
    timestamp: Date
  }
  ACADEMIC_YEAR_CREATED: {
    schoolId: string
    academicYearId: string
    name: string
    timestamp: Date
  }
  TERM_STARTED: {
    schoolId: string
    termId: string
    academicYearId: string
    timestamp: Date
  }
  SUBJECT_ASSIGNED: {
    schoolId: string
    teacherId: string
    subjectId: string
    timestamp: Date
  }
  CLASS_SCHEDULE_UPDATED: {
    schoolId: string
    classId: string
    academicYearId: string
    timestamp: Date
  }
  GRADE_RECORDED: {
    schoolId: string
    studentId: string
    subjectId: string
    teacherId: string
    termId: string
    timestamp: Date
  }
  REPORT_CARD_PENDING: {
    schoolId: string
    studentId: string
    termId: string
    missingGrades: string[]  // Subject IDs
    timestamp: Date
  }
  REPORT_CARD_COMPLETE: {
    schoolId: string
    studentId: string
    termId: string
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
  PROFILE_UPDATED: {
    userId: string
    updates: object
  }
  KYC_VERIFIED: {
    userId: string
    documentType: string
  }
  SCHOOL_VERIFIED: {
    schoolId: string
    verificationId: string
  }
  EMPLOYMENT_ELIGIBILITY_UPDATED: {
    userId: string
    status: string
  }
  OWNER_OTP_VERIFIED: {
    userId: string
    otpId: string
    purpose: string
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
  STUDENT_PROFILE_CREATED: {
    userId: string
    parentId: string
    schoolId: string
  }
  TEACHER_OTP_VERIFIED: {
    userId: string
    otpId: string
    purpose: string
    schoolId: string
    type: string
  }
  TEACHER_EMPLOYMENT_ENDED: {
    userId: string
    schoolId: string
    reason: string
  }
}
```

## API Endpoints

### School Management
```typescript
// POST /schools
type CreateSchoolRequest = {
  name: string
  type: SchoolType
  settings: SchoolSettings
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId
type GetSchoolResponse = School & {
  departments: Department[]
  staffCount: number
}

// PUT /schools/:schoolId
type UpdateSchoolRequest = Partial<School>

// POST /schools/create-with-owner
type CreateSchoolWithOwnerRequest = {
  school: CreateSchoolRequest
  owner: {
    type: 'NEW_ACCOUNT' | 'EXISTING_ACCOUNT'
    personalInfo?: {
      email: string
      firstName: string
      lastName: string
      // other required fields
    }
    otpCode?: string
  }
}

// GET /schools/:schoolId/owner
type GetSchoolOwnerResponse = {
  ownerId: string
  ownershipType: string
  verificationStatus: VerificationStatus
  ownerProfile?: {
    email: string
    firstName: string
    lastName: string
  }
}

// PUT /schools/:schoolId/owner
type UpdateSchoolOwnerRequest = {
  ownerId?: string
  ownershipType?: string
  verificationStatus?: VerificationStatus
}
```

### Class Management
```typescript
// POST /schools/:schoolId/classes
type CreateClassRequest = {
  name: string
  grade: string
  academicYear: string
  departmentId?: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/classes
type GetClassesResponse = {
  classes: Class[]
}
```

### Staff Management
```typescript
// POST /schools/:schoolId/staff
type AssignStaffRequest = {
  userId: string
  role: StaffRole
  startDate: Date
  endDate?: Date
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/staff
type GetStaffResponse = {
  assignments: (StaffAssignment & {
    user: {
      id: string
      name: string
      email: string
    }
  })[]
}
```

### Student Registration
```typescript
// POST /schools/:schoolId/students/register
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
      occupation?: string
      workAddress?: Address
    }
  }
  grade: string
}

// GET /schools/:schoolId/students
type GetSchoolStudentsResponse = {
  students: Array<{
    id: string
    profile: StudentProfile
    enrollment: StudentEnrollment
    parent: ParentProfile
  }>
  total: number
}
```

### Student Transfer
```typescript
// POST /schools/:schoolId/students/transfer
type InitiateTransferRequest = {
  studentId: string
  toSchoolId: string
  grade: string
  reason: string
  parentOtpCode: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/transfers
type GetTransfersResponse = {
  incoming: StudentTransfer[]
  outgoing: StudentTransfer[]
}

// PUT /schools/:schoolId/transfers/:transferId/approve
type ApproveTransferRequest = {
  approverNotes?: string
}
```

### Teacher Employment Management
```typescript
// POST /schools/:schoolId/teachers/assign
type AssignTeacherRequest = {
  teacher: {
    type: 'NEW_ACCOUNT' | 'EXISTING_ACCOUNT'
    otpCode?: string
    personalInfo?: {
      email: string
      firstName: string
      lastName: string
      specialization: string[]
      qualifications: {
        degree: string
        institution: string
        year: number
      }[]
    }
  }
  assignment: {
    type: EmploymentType
    startDate: Date
    subjects: string[]
    classes: string[]
    schedule: TeachingSchedule
  }
}

// POST /schools/:schoolId/teachers/:teacherId/end-assignment
type EndTeacherAssignmentRequest = {
  reason: string
  effectiveDate: Date
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/teachers
type GetSchoolTeachersResponse = {
  teachers: Array<{
    id: string
    profile: TeacherProfile
    assignment: TeacherAssignment
  }>
  total: number
}

// POST /schools/:schoolId/teachers/transitions
type RequestTeacherTransitionRequest = {
  teacherId: string
  type: TransitionType
  reason: string
  effectiveDate: Date
  toSchoolId?: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/teachers/transitions
type GetTeacherTransitionsResponse = {
  pending: TeacherTransition[]
  completed: TeacherTransition[]
}
```

### Employee Management
```typescript
// POST /schools/:schoolId/employees/:employeeId/salary
type SetEmployeeSalaryRequest = {
  amount: number
  currency: string
  type: SalaryType
  effectiveFrom: Date
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/assignments/:assignmentId/approve
type ApproveAssignmentRequest = {
  salary: number
  currency: string
  notes?: string
}

// GET /schools/:schoolId/assignments/pending
type GetPendingAssignmentsResponse = {
  assignments: Array<{
    id: string
    employee: {
      id: string
      name: string
      role: string
    }
    type: string
    startDate: Date
  }>
}
```

### School Management
```typescript
// POST /schools/:schoolId/head
type AssignSchoolHeadRequest = {
  userId: string
  startDate: Date
  salary: number
  currency: string
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/head/remove
type RemoveSchoolHeadRequest = {
  reason: string
  effectiveDate: Date
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/admin
type AssignSchoolAdminRequest = {
  userId: string
  startDate: Date
  salary: number
  currency: string
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/employees/:employeeId/terminate
type TerminateEmployeeRequest = {
  reason: string
  details: string
  effectiveDate: Date
  type: TerminationType
  metadata?: Record<string, unknown>
}
```

### Performance Tracking
```typescript
// GET /schools/:schoolId/performance
type GetSchoolPerformanceResponse = {
  current: {
    period: string
    metrics: SchoolMetrics
  }
  historical: Array<{
    period: string
    metrics: SchoolMetrics
  }>
}

// GET /schools/compare
type CompareSchoolsRequest = {
  schoolIds: string[]
  period: string
  metrics: string[]
}

type CompareSchoolsResponse = {
  period: string
  comparisons: Array<{
    schoolId: string
    metrics: SchoolMetrics
    ranking: Record<string, number>
  }>
}
```

### Payment Management
```typescript
// POST /schools/:schoolId/payment-templates
type CreatePaymentTemplateRequest = {
  name: string
  type: string
  amount: number
  currency: string
  description?: string
  dueDate?: Date
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/receipt-templates
type CreateReceiptTemplateRequest = {
  name: string
  template: string
  logo?: string
  footer?: string
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/payments
type RecordPaymentRequest = {
  studentId: string
  parentId: string
  amount: number
  currency: string
  type: string
  paymentDate: Date
  description?: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/payments
type GetPaymentsResponse = {
  payments: Array<{
    id: string
    student: {
      id: string
      name: string
    }
    parent: {
      id: string
      name: string
    }
    amount: number
    currency: string
    receiptNumber: string
    paymentDate: Date
    status: PaymentStatus
  }>
  total: number
}

// GET /schools/:schoolId/payments/:paymentId/receipt
type GetReceiptResponse = {
  receiptNumber: string
  schoolInfo: {
    name: string
    logo?: string
    address: string
  }
  paymentInfo: {
    amount: number
    currency: string
    date: Date
    description?: string
  }
  studentInfo: {
    name: string
    grade: string
  }
  parentInfo: {
    name: string
  }
}
```

### Academic Management
```typescript
// POST /schools/:schoolId/academic-years
type CreateAcademicYearRequest = {
  name: string
  startDate: Date
  endDate: Date
  terms: Array<{
    name: string
    startDate: Date
    endDate: Date
  }>
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/subjects
type CreateSubjectRequest = {
  name: string
  code: string
  description?: string
  gradeLevel: string[]
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/teachers/:teacherId/subjects
type AssignSubjectsRequest = {
  subjects: Array<{
    subjectId: string
    academicYearId: string
  }>
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/classes/:classId/schedule
type SetClassScheduleRequest = {
  academicYearId: string
  schedule: {
    [day: string]: Array<{
      period: number
      startTime: string
      endTime: string
      subjectId: string
      teacherId: string
    }>
  }
  metadata?: Record<string, unknown>
}

// POST /schools/:schoolId/students/:studentId/grades
type RecordGradeRequest = {
  subjectId: string
  termId: string
  academicYearId: string
  grade: number
  remarks?: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/report-cards/pending
type GetPendingReportCardsResponse = {
  reportCards: Array<{
    studentId: string
    studentName: string
    termId: string
    missingSubjects: Array<{
      subjectId: string
      subjectName: string
      teacherId: string
      teacherName: string
    }>
  }>
}

// GET /schools/:schoolId/students/:studentId/report-card
type GetReportCardResponse = {
  student: {
    id: string
    name: string
    grade: string
  }
  term: {
    id: string
    name: string
    academicYear: string
  }
  grades: Array<{
    subject: {
      id: string
      name: string
      teacher: string
    }
    grade: number
    remarks: string
  }>
  attendance: {
    present: number
    absent: number
    late: number
  }
  remarks: {
    teacher: string
    headmaster: string
  }
  status: ReportStatus
}
```

## Implementation Plan

### Phase 1: Core School Management
1. School CRUD operations
2. School settings management
3. Department management
4. Basic validation rules

### Phase 2: Class Management
1. Class creation and updates
2. Grade level management
3. Academic year handling
4. Class assignment rules

### Phase 3: Staff Management
1. Staff assignment system
2. Role management
3. Employment period tracking
4. Staff validation rules

### Phase 4: Integration Features
1. KYC integration
2. Employment eligibility checks
3. Event system integration
4. Reporting system

### Phase 5: School Ownership Management
1. School owner creation flow
2. Existing owner linking
3. Owner verification process
4. Ownership transfer handling

### Phase 6: Student Management
1. Student registration workflow
2. Parent verification system
3. Enrollment tracking
4. Transfer management
5. Access control updates

### Phase 7: Teacher Employment
1. Teacher assignment workflow
2. Employment type management
3. Teaching schedule handling
4. Transition processing
5. Employment history tracking

### Phase 8: Advanced Employee Management
1. Salary management system
2. Assignment approval workflow
3. Termination tracking
4. Performance metrics

### Phase 9: School Owner Controls
1. Multi-school performance tracking
2. School comparison system
3. Administrative staff management
4. Notification system integration

### Phase 10: Payment Management
1. Payment template system
2. Receipt template customization
3. Payment recording workflow
4. Receipt generation and printing
5. Payment history tracking

### Phase 11: Academic Management
1. Academic year and term tracking
2. Subject management system
3. Teacher subject assignment
4. Class schedule management
5. Grade recording system
6. Report card generation

## Testing Strategy

### Unit Tests
```typescript
// School service tests
describe('SchoolService', () => {
  test('should create school with settings')
  test('should validate school type')
  test('should manage departments')
})

// Staff service tests
describe('StaffService', () => {
  test('should assign staff with valid role')
  test('should validate employment dates')
  test('should prevent role conflicts')
})

// School owner tests
describe('SchoolOwnerService', () => {
  test('should create school with new owner')
  test('should link existing owner')
  test('should validate owner OTP')
  test('should handle ownership transfer')
})

// Student registration tests
describe('StudentRegistrationService', () => {
  test('should register with new parent')
  test('should register with existing parent')
  test('should validate enrollment data')
})

// Transfer management tests
describe('TransferService', () => {
  test('should initiate transfer')
  test('should validate parent authorization')
  test('should handle school transitions')
  test('should track transfer history')
})

// Teacher assignment tests
describe('TeacherAssignmentService', () => {
  test('should assign new teacher')
  test('should handle existing teacher')
  test('should validate employment type')
  test('should manage teaching schedule')
})

// Teacher transition tests
describe('TeacherTransitionService', () => {
  test('should process resignation')
  test('should handle transfers')
  test('should validate transition rules')
})

// Salary management tests
describe('SalaryService', () => {
  test('should set employee salary')
  test('should track salary history')
  test('should require head approval')
})

// School management tests
describe('SchoolManagementService', () => {
  test('should assign school head')
  test('should manage admins')
  test('should track terminations')
})

// Performance tracking tests
describe('PerformanceService', () => {
  test('should track metrics')
  test('should compare schools')
  test('should generate reports')
})

// Payment management tests
describe('PaymentService', () => {
  test('should create payment templates')
  test('should customize receipt templates')
  test('should record offline payments')
  test('should generate unique receipt numbers')
  test('should track payment history')
})
```

### Integration Tests
```typescript
describe('School API', () => {
  test('should manage school lifecycle')
  test('should handle class creation')
  test('should manage staff assignments')
  test('should integrate with KYC')
})

describe('School Owner API', () => {
  test('should create school with owner data')
  test('should link school to existing owner')
  test('should verify owner status')
})

describe('Student Management API', () => {
  test('should handle registration flow')
  test('should process transfers')
  test('should manage access control')
  test('should track enrollment history')
})

describe('Teacher Employment API', () => {
  test('should manage teacher assignments')
  test('should handle employment changes')
  test('should process transitions')
  test('should enforce business rules')
})
```

## Monitoring & Logging

### Metrics
- School creation rate
- Class creation rate
- Staff assignment rate
- API endpoint usage
- Error rates by type

### Logging
```typescript
const logger = createLogger({
  service: 'school-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Data Validation Rules
1. School name and type validation
2. Class size and grade constraints
3. Staff role compatibility
4. Employment period validation
5. Department hierarchy rules 
6. Teaching schedule validation
7. Employment type restrictions
8. Transition timing rules

## Security Measures
6. Parent authorization checks
7. Transfer validation rules
8. Historical data protection 
9. Employment verification
10. Schedule conflict prevention
11. Transition authorization 
12. Salary information protection
13. Termination record security
14. Performance data access control 