import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Role } from '@eduflow/prisma';
import { RouteGenericInterface } from 'fastify/types/route';

interface DatabaseRequest<T extends RouteGenericInterface = RouteGenericInterface>
  extends FastifyRequest<T> {
  db: PrismaClient;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

export async function reportCardAccessGuard(
  request: DatabaseRequest<{
    Params: { reportCardId: string };
  }>,
  reply: FastifyReply
) {
  const { reportCardId } = request.params;
  const userId = request.user.id;

  // Get report card from database
  const reportCard = await request.db.reportCard.findUnique({
    where: { id: reportCardId },
  });

  if (!reportCard) {
    return reply.status(404).send({ message: 'Report card not found' });
  }

  // Check if user is headmaster or teacher
  const staffAssignment = await request.db.staffAssignment.findFirst({
    where: {
      schoolId: reportCard.schoolId,
      role: { in: ['SCHOOL_HEAD', 'TEACHER'] },
    },
  });

  if (staffAssignment) {
    return; // Allow access for staff
  }

  // Check if user is parent and report card is available
  const parentProfile = await request.db.parentProfile.findFirst({
    where: {
      profile: {
        userId,
      },
    },
  });

  if (!parentProfile) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  const parentStudentRelation = await request.db.parentStudentRelation.findFirst({
    where: {
      parentProfileId: parentProfile.id,
      studentProfileId: reportCard.studentProfileId,
    },
  });

  if (!parentStudentRelation) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  if (reportCard.status !== 'AVAILABLE') {
    return reply.status(403).send({
      message: 'Report card is not yet available for viewing',
    });
  }
}

export async function gradeRecordingGuard(
  request: DatabaseRequest<{
    Params: { studentId: string; subjectId: string };
  }>,
  reply: FastifyReply
) {
  const { studentId, subjectId } = request.params;
  const userId = request.user.id;

  // Check if teacher is assigned to this subject for this student
  const staffProfile = await request.db.staffProfile.findFirst({
    where: {
      profile: {
        userId,
      },
    },
  });

  if (!staffProfile) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  const assignment = await request.db.classSubject.findFirst({
    where: {
      subjectId,
      staffProfileId: staffProfile.id,
      class: {
        students: {
          some: {
            studentProfileId: studentId,
          },
        },
      },
    },
  });

  if (!assignment) {
    return reply.status(403).send({
      message: 'You are not authorized to record grades for this student in this subject',
    });
  }
}

export async function reportCardPrintGuard(
  request: DatabaseRequest<{
    Params: { reportCardId: string };
  }>,
  reply: FastifyReply
) {
  const { reportCardId } = request.params;
  const userId = request.user.id;

  // Get staff profile
  const staffProfile = await request.db.staffProfile.findFirst({
    where: {
      profile: {
        userId,
      },
    },
  });

  if (!staffProfile) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  // Check if user is headmaster
  const staffAssignment = await request.db.staffAssignment.findFirst({
    where: {
      staffProfileId: staffProfile.id,
      role: 'SCHOOL_HEAD',
    },
  });

  if (!staffAssignment) {
    return reply.status(403).send({
      message: 'Only headmasters can print report cards',
    });
  }

  // Check if all grades are approved
  const reportCard = await request.db.reportCard.findUnique({
    where: { id: reportCardId },
    include: { grades: true },
  });

  if (!reportCard) {
    return reply.status(404).send({ message: 'Report card not found' });
  }

  const hasUnapprovedGrades = reportCard.grades.some((grade) => grade.status !== 'APPROVED');

  if (hasUnapprovedGrades) {
    return reply.status(400).send({
      message: 'All grades must be approved before printing',
    });
  }
}
