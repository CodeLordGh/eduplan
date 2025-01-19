/*
  Warnings:

  - You are about to drop the column `createdAt` on the `staff_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastEvaluationDate` on the `staff_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `staff_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `performanceRating` on the `staff_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `staff_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "staff_profiles_department_idx";

-- DropIndex
DROP INDEX "staff_profiles_employmentType_idx";

-- DropIndex
DROP INDEX "staff_profiles_performanceRating_idx";

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staff_profiles" DROP COLUMN "createdAt",
DROP COLUMN "lastEvaluationDate",
DROP COLUMN "metadata",
DROP COLUMN "performanceRating",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "kycStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "staff_profiles_employeeId_idx" ON "staff_profiles"("employeeId");
