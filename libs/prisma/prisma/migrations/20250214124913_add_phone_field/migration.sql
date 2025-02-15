-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'SCHOOL_OWNER', 'SCHOOL_HEAD', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT', 'CHEF', 'SECURITY', 'TRANSPORT_OFFICER', 'KYC_OFFICER', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OTPStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmploymentEligibilityStatus" AS ENUM ('NOT_CHECKED', 'ELIGIBLE', 'INELIGIBLE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IDENTITY', 'SCHOOL_LICENSE', 'EMPLOYMENT_PROOF', 'QUALIFICATION');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'SCHOOL');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReportCardStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "OccupationType" AS ENUM ('EDUCATION_SECTOR', 'HEALTHCARE', 'TRANSPORTATION', 'CONSTRUCTION', 'BUSINESS', 'TECHNOLOGY', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('PROFILE_PICTURE', 'KYC_DOCUMENT', 'SCHOOL_DOCUMENT', 'STUDENT_WORK', 'COURSE_MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FileAccessLevel" AS ENUM ('PUBLIC', 'PRIVATE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'CLOUDINARY', 'S3');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "phone" VARCHAR(15),
    "roles" "Role"[] DEFAULT ARRAY[]::"Role"[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "kycStatus" "VerificationStatus" DEFAULT 'PENDING',
    "kycVerifiedAt" TIMESTAMP(3),
    "kycDocumentIds" TEXT[],
    "employmentStatus" "EmploymentEligibilityStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "employmentVerifiedAt" TIMESTAMP(3),
    "employmentDocumentIds" TEXT[],
    "socialAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "OTPStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "documentUrls" TEXT[],
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationHistory" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "verifiedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "address" JSONB,
    "gender" TEXT,
    "nationality" TEXT,
    "emergencyContact" JSONB,
    "occupation" TEXT,
    "occupationType" "OccupationType",
    "employer" TEXT,
    "employerDetails" JSONB,
    "workAddress" JSONB,
    "education" JSONB[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB,
    "communicationPreferences" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "deviceInfo" JSONB,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "currentPosition" TEXT,
    "yearsOfExperience" INTEGER,
    "workHistory" JSONB[],
    "teachingExperience" JSONB,
    "subjectsQualified" TEXT[],
    "adminExperience" JSONB,
    "certifications" JSONB[],
    "licenses" JSONB[],
    "skills" TEXT[],
    "specializations" TEXT[],
    "achievements" JSONB[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "license" JSONB NOT NULL,
    "contact" JSONB NOT NULL,
    "address" JSONB NOT NULL,
    "facilities" TEXT[],
    "capacity" INTEGER NOT NULL,
    "curriculum" TEXT[],
    "languages" TEXT[],
    "operatingHours" JSONB NOT NULL,
    "termDates" JSONB[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "settings" JSONB,
    "communicationSettings" JSONB,
    "createdBy" TEXT NOT NULL,
    "ownershipDetails" JSONB NOT NULL,
    "systemApproval" JSONB,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_assignments" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_relations" (
    "id" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_student_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "syllabus" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "maxStudents" INTEGER,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT,
    "academicYear" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "schedule" JSONB NOT NULL,
    "schoolId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classMasterId" TEXT,
    "classMasterHistory" JSONB[],

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_students" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "teacherComments" TEXT,
    "principalComments" TEXT,
    "attendance" JSONB,
    "status" "ReportCardStatus" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "grade" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "assessmentType" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "status" "GradeStatus" NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "weightage" DOUBLE PRECISION,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

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
    "teachingHours" INTEGER,
    "specializations" TEXT[],

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

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "category" "FileCategory" NOT NULL,
    "accessLevel" "FileAccessLevel" NOT NULL DEFAULT 'PRIVATE',
    "provider" "StorageProvider" NOT NULL,
    "metadata" JSONB,
    "ownerId" TEXT NOT NULL,
    "ownerType" "EntityType" NOT NULL,
    "accessibleTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_quotas" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "totalSize" INTEGER NOT NULL,
    "usedSize" INTEGER NOT NULL,
    "maxSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_roles_idx" ON "users"("roles");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");

-- CreateIndex
CREATE INDEX "users_employmentStatus_idx" ON "users"("employmentStatus");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "KYCDocument_userId_idx" ON "KYCDocument"("userId");

-- CreateIndex
CREATE INDEX "KYCDocument_type_idx" ON "KYCDocument"("type");

-- CreateIndex
CREATE INDEX "KYCDocument_status_idx" ON "KYCDocument"("status");

-- CreateIndex
CREATE INDEX "KYCDocument_createdAt_idx" ON "KYCDocument"("createdAt");

-- CreateIndex
CREATE INDEX "KYCDocument_verifiedAt_idx" ON "KYCDocument"("verifiedAt");

-- CreateIndex
CREATE INDEX "VerificationHistory_entityId_idx" ON "VerificationHistory"("entityId");

-- CreateIndex
CREATE INDEX "VerificationHistory_entityType_idx" ON "VerificationHistory"("entityType");

-- CreateIndex
CREATE INDEX "VerificationHistory_status_idx" ON "VerificationHistory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_occupationType_idx" ON "profiles"("occupationType");

-- CreateIndex
CREATE INDEX "profiles_dateOfBirth_idx" ON "profiles"("dateOfBirth");

-- CreateIndex
CREATE INDEX "profiles_lastActivityAt_idx" ON "profiles"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_profileId_key" ON "professional_profiles"("profileId");

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
CREATE UNIQUE INDEX "parent_student_relations_parentProfileId_studentProfileId_key" ON "parent_student_relations"("parentProfileId", "studentProfileId");

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
CREATE UNIQUE INDEX "class_students_classId_studentProfileId_key" ON "class_students"("classId", "studentProfileId");

-- CreateIndex
CREATE INDEX "report_cards_academicYear_idx" ON "report_cards"("academicYear");

-- CreateIndex
CREATE INDEX "report_cards_term_idx" ON "report_cards"("term");

-- CreateIndex
CREATE INDEX "report_cards_status_idx" ON "report_cards"("status");

-- CreateIndex
CREATE INDEX "report_cards_publishedAt_idx" ON "report_cards"("publishedAt");

-- CreateIndex
CREATE INDEX "grades_studentProfileId_academicYear_idx" ON "grades"("studentProfileId", "academicYear");

-- CreateIndex
CREATE INDEX "grades_subjectId_idx" ON "grades"("subjectId");

-- CreateIndex
CREATE INDEX "grades_assessmentDate_idx" ON "grades"("assessmentDate");

-- CreateIndex
CREATE INDEX "grades_status_idx" ON "grades"("status");

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
CREATE INDEX "staff_profiles_employeeId_idx" ON "staff_profiles"("employeeId");

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
CREATE INDEX "files_ownerId_idx" ON "files"("ownerId");

-- CreateIndex
CREATE INDEX "files_ownerType_idx" ON "files"("ownerType");

-- CreateIndex
CREATE INDEX "files_type_idx" ON "files"("type");

-- CreateIndex
CREATE INDEX "files_category_idx" ON "files"("category");

-- CreateIndex
CREATE INDEX "files_accessLevel_idx" ON "files"("accessLevel");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "files"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "file_quotas_fileId_key" ON "file_quotas"("fileId");

-- CreateIndex
CREATE INDEX "file_quotas_fileId_idx" ON "file_quotas"("fileId");

-- AddForeignKey
ALTER TABLE "KYCDocument" ADD CONSTRAINT "KYCDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "report_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "file_quotas" ADD CONSTRAINT "file_quotas_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
