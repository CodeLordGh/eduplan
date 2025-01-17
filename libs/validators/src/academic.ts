import { z } from 'zod'
import { ReportCardStatus, GradeStatus } from '@eduflow/types'

export const gradeSchema = z.object({
  subjectId: z.string().uuid(),
  subjectName: z.string().min(1),
  teacherId: z.string().uuid(),
  teacherName: z.string().min(1),
  grade: z.number().min(0).max(100),
  remarks: z.string().optional(),
  status: z.nativeEnum(GradeStatus)
})

export const attendanceSchema = z.object({
  present: z.number().min(0),
  absent: z.number().min(0),
  late: z.number().min(0),
  totalDays: z.number().min(0)
}).refine(data => {
  return data.present + data.absent + data.late === data.totalDays
}, {
  message: "Total days must equal sum of present, absent, and late days"
})

export const reportCardRemarksSchema = z.object({
  teacher: z.string().optional(),
  headmaster: z.string().optional(),
  parent: z.string().optional()
})

export const reportCardSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  termId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  grades: z.array(gradeSchema),
  attendance: attendanceSchema,
  remarks: reportCardRemarksSchema,
  status: z.nativeEnum(ReportCardStatus),
  publishedAt: z.date().optional(),
  availableAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
}).refine(data => {
  if (data.status === ReportCardStatus.PUBLISHED && !data.publishedAt) {
    return false
  }
  if (data.status === ReportCardStatus.AVAILABLE && !data.availableAt) {
    return false
  }
  return true
}, {
  message: "Published/Available report cards must have corresponding dates"
})

export const reportCardAccessSchema = z.object({
  reportCardId: z.string().uuid(),
  userId: z.string().uuid(),
  accessType: z.enum(['VIEW', 'DOWNLOAD']),
  grantedAt: z.date(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
})

export const reportCardTemplateSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string().min(1),
  template: z.string().min(1),
  header: z.string().optional(),
  footer: z.string().optional(),
  logo: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
}) 