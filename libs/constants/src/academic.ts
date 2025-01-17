export const REPORT_CARD_AVAILABILITY_DELAY_HOURS = 72

export const GRADE_SCALES = {
  PERCENTAGE: {
    min: 0,
    max: 100,
    passing: 50
  },
  GPA: {
    min: 0,
    max: 4,
    passing: 2
  },
  LETTER: {
    values: ['A+', 'A', 'B', 'C', 'D', 'F'],
    passing: 'D'
  }
} as const

export const ACADEMIC_PERMISSIONS = {
  VIEW_REPORT_CARD: 'academic:report-card:view',
  DOWNLOAD_REPORT_CARD: 'academic:report-card:download',
  PRINT_REPORT_CARD: 'academic:report-card:print',
  RECORD_GRADES: 'academic:grades:record',
  APPROVE_GRADES: 'academic:grades:approve',
  MANAGE_TEMPLATES: 'academic:templates:manage'
} as const

export const REPORT_CARD_EVENTS = {
  PUBLISHED: 'REPORT_CARD_PUBLISHED',
  AVAILABLE: 'REPORT_CARD_AVAILABLE',
  ACCESSED: 'REPORT_CARD_ACCESSED',
  STATUS_UPDATED: 'REPORT_CARD_STATUS_UPDATED'
} as const

export const GRADE_EVENTS = {
  RECORDED: 'GRADE_RECORDED',
  MISSING: 'MISSING_GRADES_ALERT'
} as const 