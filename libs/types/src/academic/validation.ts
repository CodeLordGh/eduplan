import { z } from 'zod';
import { ReportCardStatus, GradeStatus } from './constants';
import { stringSchema, numberSchema, commonSchemas, validateWithSchema } from '../validation/base';

export const gradeSchema = z.object({
  subjectId: stringSchema.uuid,
  subjectName: stringSchema.nonEmpty,
  teacherId: stringSchema.uuid,
  teacherName: stringSchema.nonEmpty,
  grade: numberSchema.percentage,
  remarks: z.string().optional(),
  status: z.nativeEnum(GradeStatus),
});

export const attendanceSchema = z
  .object({
    present: numberSchema.nonNegative,
    absent: numberSchema.nonNegative,
    late: numberSchema.nonNegative,
    totalDays: numberSchema.nonNegative,
  })
  .refine(
    (data: { present: number; absent: number; late: number; totalDays: number }) => {
      return data.present + data.absent + data.late === data.totalDays;
    },
    {
      message: 'Total days must equal sum of present, absent, and late days',
    }
  );

export const reportCardRemarksSchema = z.object({
  teacher: z.string().optional(),
  headmaster: z.string().optional(),
  parent: z.string().optional(),
});

export const reportCardSchema = z
  .object({
    id: stringSchema.uuid,
    schoolId: stringSchema.uuid,
    studentId: stringSchema.uuid,
    termId: stringSchema.uuid,
    academicYearId: stringSchema.uuid,
    grades: z.array(gradeSchema),
    attendance: attendanceSchema,
    remarks: reportCardRemarksSchema,
    status: z.nativeEnum(ReportCardStatus),
    publishedAt: z.date().optional(),
    availableAt: z.date().optional(),
    metadata: commonSchemas.metadata,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.status === ReportCardStatus.PUBLISHED && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Published report cards must have a publishedAt date',
        path: ['publishedAt'],
      });
    }
    if (data.status === ReportCardStatus.AVAILABLE && !data.availableAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Available report cards must have an availableAt date',
        path: ['availableAt'],
      });
    }
  });

export const reportCardAccessSchema = z.object({
  reportCardId: z.string().uuid(),
  userId: z.string().uuid(),
  accessType: z.enum(['VIEW', 'DOWNLOAD']),
  grantedAt: z.date(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

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
  updatedAt: z.date(),
});

// Validation functions
export const validateGrade = (grade: unknown) => validateWithSchema(gradeSchema, grade);

export const validateAttendance = (attendance: unknown) =>
  validateWithSchema(attendanceSchema, attendance);

export const validateReportCard = (reportCard: unknown) =>
  validateWithSchema(reportCardSchema, reportCard);

// Types
export type Grade = z.infer<typeof gradeSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;
export type ReportCardRemarks = z.infer<typeof reportCardRemarksSchema>;
export type ReportCard = z.infer<typeof reportCardSchema>;
export type ReportCardAccess = z.infer<typeof reportCardAccessSchema>;
export type ReportCardTemplate = z.infer<typeof reportCardTemplateSchema>;
