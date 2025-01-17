import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@eduflow/prisma'
import { ReportCardStatus, Grade, UserRole, GradeStatus } from '@eduflow/types'
import { RouteGenericInterface } from 'fastify/types/route'

interface DatabaseRequest<T extends RouteGenericInterface = RouteGenericInterface> extends FastifyRequest<T> {
  db: PrismaClient
  user: {
    id: string
    email: string
    role: UserRole
  }
}

export async function reportCardAccessGuard(
  request: DatabaseRequest<{
    Params: { reportCardId: string }
  }>,
  reply: FastifyReply
) {
  const { reportCardId } = request.params
  const userId = request.user.id

  // Get report card from database
  const reportCard = await request.db.reportCard.findUnique({
    where: { id: reportCardId }
  })

  if (!reportCard) {
    return reply.status(404).send({ message: 'Report card not found' })
  }

  // Check if user is headmaster or teacher
  const isStaff = await request.db.staffAssignment.findFirst({
    where: {
      schoolId: reportCard.schoolId,
      userId,
      role: { in: ['SCHOOL_HEAD', 'TEACHER'] }
    }
  })

  if (isStaff) {
    return // Allow access for staff
  }

  // Check if user is parent and report card is available
  const isParent = await request.db.parentStudentRelation.findFirst({
    where: {
      parentId: userId,
      studentId: reportCard.studentId
    }
  })

  if (!isParent) {
    return reply.status(403).send({ message: 'Access denied' })
  }

  if (reportCard.status !== ReportCardStatus.AVAILABLE) {
    return reply.status(403).send({ 
      message: 'Report card is not yet available for viewing',
      availableAt: reportCard.availableAt
    })
  }
}

export async function gradeRecordingGuard(
  request: DatabaseRequest<{
    Params: { studentId: string; subjectId: string }
  }>,
  reply: FastifyReply
) {
  const { studentId, subjectId } = request.params
  const teacherId = request.user.id

  // Check if teacher is assigned to this subject for this student
  const assignment = await request.db.classSubject.findFirst({
    where: {
      teacherId,
      subjectId,
      class: {
        students: {
          some: { studentId }
        }
      }
    }
  })

  if (!assignment) {
    return reply.status(403).send({ 
      message: 'You are not authorized to record grades for this student in this subject' 
    })
  }
}

export async function reportCardPrintGuard(
  request: DatabaseRequest<{
    Params: { reportCardId: string }
  }>,
  reply: FastifyReply
) {
  const { reportCardId } = request.params
  const userId = request.user.id

  // Check if user is headmaster
  const isHeadmaster = await request.db.staffAssignment.findFirst({
    where: {
      userId,
      role: 'SCHOOL_HEAD'
    }
  })

  if (!isHeadmaster) {
    return reply.status(403).send({ 
      message: 'Only headmasters can print report cards' 
    })
  }

  // Check if all grades are approved
  const reportCard = await request.db.reportCard.findUnique({
    where: { id: reportCardId },
    include: { grades: true }
  })

  if (!reportCard) {
    return reply.status(404).send({ message: 'Report card not found' })
  }

  const hasUnapprovedGrades = reportCard.grades.some(
    (grade) => grade.status !== GradeStatus.APPROVED
  )

  if (hasUnapprovedGrades) {
    return reply.status(400).send({ 
      message: 'All grades must be approved before printing' 
    })
  }
} 