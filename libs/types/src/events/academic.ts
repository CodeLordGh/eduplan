import { ReportCardStatus, GradeStatus } from '../academic/report-card'

export interface AcademicEvents {
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

  GRADE_RECORDED: {
    schoolId: string
    studentId: string
    subjectId: string
    teacherId: string
    termId: string
    grade: number
    status: GradeStatus
    timestamp: Date
  }

  REPORT_CARD_STATUS_UPDATED: {
    schoolId: string
    reportCardId: string
    studentId: string
    termId: string
    previousStatus: ReportCardStatus
    newStatus: ReportCardStatus
    updatedBy: string
    timestamp: Date
  }

  REPORT_CARD_PUBLISHED: {
    schoolId: string
    reportCardId: string
    studentId: string
    termId: string
    publishedBy: string  // Headmaster ID
    availableAt: Date    // 72 hours after publishing
    timestamp: Date
  }

  REPORT_CARD_AVAILABLE: {
    schoolId: string
    reportCardId: string
    studentId: string
    termId: string
    parentId: string
    timestamp: Date
  }

  REPORT_CARD_ACCESSED: {
    schoolId: string
    reportCardId: string
    studentId: string
    accessedBy: string   // Parent ID
    accessType: 'VIEW' | 'DOWNLOAD'
    timestamp: Date
  }

  MISSING_GRADES_ALERT: {
    schoolId: string
    termId: string
    studentId: string
    missingSubjects: Array<{
      subjectId: string
      subjectName: string
      teacherId: string
      teacherName: string
    }>
    timestamp: Date
  }
} 