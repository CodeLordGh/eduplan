export enum ReportCardStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',  // When headmaster prints it
  AVAILABLE = 'AVAILABLE'   // After 72 hours, available to parents
}

export enum GradeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED'
}

export interface Grade {
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  grade: number
  remarks?: string
  status: GradeStatus
}

export interface Attendance {
  present: number
  absent: number
  late: number
  totalDays: number
}

export interface ReportCardRemarks {
  teacher?: string
  headmaster?: string
  parent?: string
}

export interface ReportCard {
  id: string
  schoolId: string
  studentId: string
  termId: string
  academicYearId: string
  grades: Grade[]
  attendance: Attendance
  remarks: ReportCardRemarks
  status: ReportCardStatus
  publishedAt?: Date      // When headmaster prints
  availableAt?: Date      // 72 hours after publishing
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface ReportCardAccess {
  reportCardId: string
  userId: string          // Parent or guardian ID
  accessType: 'VIEW' | 'DOWNLOAD'
  grantedAt: Date
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface ReportCardTemplate {
  id: string
  schoolId: string
  name: string
  template: string        // HTML/JSON template
  header?: string
  footer?: string
  logo?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
} 