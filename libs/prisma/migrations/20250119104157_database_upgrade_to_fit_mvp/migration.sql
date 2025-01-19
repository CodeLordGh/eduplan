/*
  Warnings:

  - You are about to drop the column `studentId` on the `class_students` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `class_subjects` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `parent_student_relations` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `parent_student_relations` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `professional_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `professional_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `availableAt` on the `report_cards` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `report_cards` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `staff_assignments` table. All the data in the column will be lost.
  - You are about to drop the `user_relationships` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[classId,studentProfileId]` on the table `class_students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[classId,subjectId,academicYear]` on the table `class_subjects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,name,academicYear]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentProfileId,studentProfileId]` on the table `parent_student_relations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileId]` on the table `professional_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNumber]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staffProfileId,schoolId,role]` on the table `staff_assignments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `enrollmentDate` to the `class_students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `class_students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `class_students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `class_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule` to the `class_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffProfileId` to the `class_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `class_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentDate` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentType` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffProfileId` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentProfileId` to the `parent_student_relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationship` to the `parent_student_relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `parent_student_relations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `professional_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `report_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `report_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `report_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `license` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operatingHours` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownershipDetails` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNumber` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffProfileId` to the `staff_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `staff_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OccupationType" AS ENUM ('EDUCATION_SECTOR', 'HEALTHCARE', 'TRANSPORTATION', 'CONSTRUCTION', 'BUSINESS', 'TECHNOLOGY', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'CHEF';
ALTER TYPE "Role" ADD VALUE 'SECURITY';
ALTER TYPE "Role" ADD VALUE 'TRANSPORT_OFFICER';
ALTER TYPE "Role" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "professional_profiles" DROP CONSTRAINT "professional_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_relationships" DROP CONSTRAINT "user_relationships_relatedUserId_fkey";

-- DropForeignKey
ALTER TABLE "user_relationships" DROP CONSTRAINT "user_relationships_userId_fkey";

-- DropIndex
DROP INDEX "class_students_classId_studentId_key";

-- DropIndex
DROP INDEX "class_subjects_classId_subjectId_key";

-- DropIndex
DROP INDEX "parent_student_relations_parentId_studentId_key";

-- DropIndex
DROP INDEX "professional_profiles_userId_key";

-- DropIndex
DROP INDEX "staff_assignments_userId_schoolId_key";

-- AlterTable
ALTER TABLE "class_students" DROP COLUMN "studentId",
ADD COLUMN     "enrollmentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "class_subjects" DROP COLUMN "teacherId",
ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxStudents" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "schedule" JSONB NOT NULL,
ADD COLUMN     "staffProfileId" TEXT NOT NULL,
ADD COLUMN     "syllabus" JSONB,
ADD COLUMN     "term" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "classMasterHistory" JSONB[],
ADD COLUMN     "classMasterId" TEXT,
ADD COLUMN     "grade" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "schedule" JSONB NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "assessmentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "assessmentType" TEXT NOT NULL,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "staffProfileId" TEXT NOT NULL,
ADD COLUMN     "studentProfileId" TEXT NOT NULL,
ADD COLUMN     "term" TEXT NOT NULL,
ADD COLUMN     "weightage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "parent_student_relations" DROP COLUMN "parentId",
DROP COLUMN "studentId",
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "parentProfileId" TEXT NOT NULL,
ADD COLUMN     "relationship" TEXT NOT NULL,
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "professional_profiles" DROP COLUMN "experience",
DROP COLUMN "userId",
ADD COLUMN     "achievements" JSONB[],
ADD COLUMN     "adminExperience" JSONB,
ADD COLUMN     "currentPosition" TEXT,
ADD COLUMN     "licenses" JSONB[],
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "specializations" TEXT[],
ADD COLUMN     "subjectsQualified" TEXT[],
ADD COLUMN     "teachingExperience" JSONB,
ADD COLUMN     "workHistory" JSONB[],
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "contact",
ADD COLUMN     "address" JSONB NOT NULL,
ADD COLUMN     "communicationPreferences" JSONB,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "education" JSONB[],
ADD COLUMN     "emergencyContact" JSONB,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "employerDetails" JSONB,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "occupationType" "OccupationType",
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "workAddress" JSONB,
ALTER COLUMN "occupation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "report_cards" DROP COLUMN "availableAt",
DROP COLUMN "studentId",
ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "attendance" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "principalComments" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "studentProfileId" TEXT NOT NULL,
ADD COLUMN     "teacherComments" TEXT,
ADD COLUMN     "term" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "address" JSONB NOT NULL,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "communicationSettings" JSONB,
ADD COLUMN     "contact" JSONB NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "curriculum" TEXT[],
ADD COLUMN     "facilities" TEXT[],
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "license" JSONB NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "operatingHours" JSONB NOT NULL,
ADD COLUMN     "ownershipDetails" JSONB NOT NULL,
ADD COLUMN     "registrationNumber" TEXT NOT NULL,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "systemApproval" JSONB,
ADD COLUMN     "termDates" JSONB[],
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "staff_assignments" DROP COLUMN "userId",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "staffProfileId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "user_relationships";

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "currentGrade" TEXT,
    "previousSchools" JSONB[],
    "learningProgress" JSONB[],
    "achievements" JSONB[],
    "extracurricular" JSONB[],
    "specialNeeds" JSONB,
    "medicalInfo" JSONB,
    "dietaryRestrictions" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentGPA" DOUBLE PRECISION,
    "academicStanding" TEXT,
    "attendanceRate" DOUBLE PRECISION,
    "lastAttendanceDate" TIMESTAMP(3),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "preferredLanguage" TEXT,
    "communicationPreferences" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3),
    "timeOut" TIMESTAMP(3),
    "reason" TEXT,
    "isExcused" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "classMasterId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "modifiedBy" TEXT,
    "modifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "schedule" JSONB,
    "responsibilities" TEXT[],
    "performanceRating" DOUBLE PRECISION,
    "lastEvaluationDate" TIMESTAMP(3),
    "teachingHours" INTEGER,
    "specializations" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "gradeLevel" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "credits" DOUBLE PRECISION,
    "prerequisites" TEXT[],
    "corequisites" TEXT[],
    "learningOutcomes" TEXT[],
    "assessmentCriteria" JSONB,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_assignments" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_groups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_roles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissions" TEXT[],
    "communicationPermissions" TEXT[],
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_profileId_key" ON "student_profiles"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_admissionNumber_key" ON "student_profiles"("admissionNumber");

-- CreateIndex
CREATE INDEX "student_profiles_currentGrade_idx" ON "student_profiles"("currentGrade");

-- CreateIndex
CREATE INDEX "student_profiles_enrollmentDate_idx" ON "student_profiles"("enrollmentDate");

-- CreateIndex
CREATE INDEX "student_profiles_currentGPA_idx" ON "student_profiles"("currentGPA");

-- CreateIndex
CREATE INDEX "student_profiles_attendanceRate_idx" ON "student_profiles"("attendanceRate");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_profileId_key" ON "parent_profiles"("profileId");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE INDEX "attendance_records_academicYear_term_idx" ON "attendance_records"("academicYear", "term");

-- CreateIndex
CREATE INDEX "attendance_records_classMasterId_idx" ON "attendance_records"("classMasterId");

-- CreateIndex
CREATE INDEX "attendance_records_classId_idx" ON "attendance_records"("classId");

-- CreateIndex
CREATE INDEX "attendance_records_recordedBy_idx" ON "attendance_records"("recordedBy");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentProfileId_date_key" ON "attendance_records"("studentProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_profileId_key" ON "staff_profiles"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_employeeId_key" ON "staff_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "staff_profiles_employmentType_idx" ON "staff_profiles"("employmentType");

-- CreateIndex
CREATE INDEX "staff_profiles_department_idx" ON "staff_profiles"("department");

-- CreateIndex
CREATE INDEX "staff_profiles_performanceRating_idx" ON "staff_profiles"("performanceRating");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_category_idx" ON "subjects"("category");

-- CreateIndex
CREATE INDEX "subjects_code_idx" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_gradeLevel_idx" ON "subjects"("gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "subject_assignments_subjectId_staffProfileId_academicYear_key" ON "subject_assignments"("subjectId", "staffProfileId", "academicYear");

-- CreateIndex
CREATE INDEX "communication_groups_schoolId_idx" ON "communication_groups"("schoolId");

-- CreateIndex
CREATE INDEX "communication_groups_type_idx" ON "communication_groups"("type");

-- CreateIndex
CREATE INDEX "school_roles_schoolId_idx" ON "school_roles"("schoolId");

-- CreateIndex
CREATE INDEX "school_roles_userId_idx" ON "school_roles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "school_roles_schoolId_userId_role_key" ON "school_roles"("schoolId", "userId", "role");

-- CreateIndex
CREATE INDEX "KYCDocument_createdAt_idx" ON "KYCDocument"("createdAt");

-- CreateIndex
CREATE INDEX "KYCDocument_verifiedAt_idx" ON "KYCDocument"("verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "class_students_classId_studentProfileId_key" ON "class_students"("classId", "studentProfileId");

-- CreateIndex
CREATE INDEX "class_subjects_schoolId_academicYear_idx" ON "class_subjects"("schoolId", "academicYear");

-- CreateIndex
CREATE INDEX "class_subjects_staffProfileId_idx" ON "class_subjects"("staffProfileId");

-- CreateIndex
CREATE INDEX "class_subjects_term_idx" ON "class_subjects"("term");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_subjectId_academicYear_key" ON "class_subjects"("classId", "subjectId", "academicYear");

-- CreateIndex
CREATE INDEX "classes_grade_idx" ON "classes"("grade");

-- CreateIndex
CREATE INDEX "classes_academicYear_idx" ON "classes"("academicYear");

-- CreateIndex
CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");

-- CreateIndex
CREATE INDEX "classes_classMasterId_idx" ON "classes"("classMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_schoolId_name_academicYear_key" ON "classes"("schoolId", "name", "academicYear");

-- CreateIndex
CREATE INDEX "grades_studentProfileId_academicYear_idx" ON "grades"("studentProfileId", "academicYear");

-- CreateIndex
CREATE INDEX "grades_subjectId_idx" ON "grades"("subjectId");

-- CreateIndex
CREATE INDEX "grades_assessmentDate_idx" ON "grades"("assessmentDate");

-- CreateIndex
CREATE INDEX "grades_status_idx" ON "grades"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_relations_parentProfileId_studentProfileId_key" ON "parent_student_relations"("parentProfileId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_profileId_key" ON "professional_profiles"("profileId");

-- CreateIndex
CREATE INDEX "profiles_occupationType_idx" ON "profiles"("occupationType");

-- CreateIndex
CREATE INDEX "profiles_dateOfBirth_idx" ON "profiles"("dateOfBirth");

-- CreateIndex
CREATE INDEX "profiles_lastActivityAt_idx" ON "profiles"("lastActivityAt");

-- CreateIndex
CREATE INDEX "report_cards_academicYear_idx" ON "report_cards"("academicYear");

-- CreateIndex
CREATE INDEX "report_cards_term_idx" ON "report_cards"("term");

-- CreateIndex
CREATE INDEX "report_cards_status_idx" ON "report_cards"("status");

-- CreateIndex
CREATE INDEX "report_cards_publishedAt_idx" ON "report_cards"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "schools_registrationNumber_key" ON "schools"("registrationNumber");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE INDEX "schools_type_idx" ON "schools"("type");

-- CreateIndex
CREATE INDEX "schools_verificationStatus_idx" ON "schools"("verificationStatus");

-- CreateIndex
CREATE INDEX "schools_createdAt_idx" ON "schools"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_assignments_staffProfileId_schoolId_role_key" ON "staff_assignments"("staffProfileId", "schoolId", "role");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");

-- CreateIndex
CREATE INDEX "users_employmentStatus_idx" ON "users"("employmentStatus");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_groups" ADD CONSTRAINT "communication_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_roles" ADD CONSTRAINT "school_roles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
