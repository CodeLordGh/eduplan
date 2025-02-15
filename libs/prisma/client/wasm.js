
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  phone: 'phone',
  roles: 'roles',
  permissions: 'permissions',
  status: 'status',
  kycStatus: 'kycStatus',
  kycVerifiedAt: 'kycVerifiedAt',
  kycDocumentIds: 'kycDocumentIds',
  employmentStatus: 'employmentStatus',
  employmentVerifiedAt: 'employmentVerifiedAt',
  employmentDocumentIds: 'employmentDocumentIds',
  socialAccessEnabled: 'socialAccessEnabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.OTPScalarFieldEnum = {
  id: 'id',
  code: 'code',
  userId: 'userId',
  expiresAt: 'expiresAt',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.KYCDocumentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  status: 'status',
  documentUrls: 'documentUrls',
  verifiedAt: 'verifiedAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationHistoryScalarFieldEnum = {
  id: 'id',
  entityId: 'entityId',
  entityType: 'entityType',
  status: 'status',
  verifiedBy: 'verifiedBy',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  firstName: 'firstName',
  lastName: 'lastName',
  middleName: 'middleName',
  dateOfBirth: 'dateOfBirth',
  phoneNumber: 'phoneNumber',
  address: 'address',
  gender: 'gender',
  nationality: 'nationality',
  emergencyContact: 'emergencyContact',
  occupation: 'occupation',
  occupationType: 'occupationType',
  employer: 'employer',
  employerDetails: 'employerDetails',
  workAddress: 'workAddress',
  education: 'education',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  settings: 'settings',
  communicationPreferences: 'communicationPreferences',
  lastLoginAt: 'lastLoginAt',
  lastActivityAt: 'lastActivityAt',
  deviceInfo: 'deviceInfo'
};

exports.Prisma.ProfessionalProfileScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  currentPosition: 'currentPosition',
  yearsOfExperience: 'yearsOfExperience',
  workHistory: 'workHistory',
  teachingExperience: 'teachingExperience',
  subjectsQualified: 'subjectsQualified',
  adminExperience: 'adminExperience',
  certifications: 'certifications',
  licenses: 'licenses',
  skills: 'skills',
  specializations: 'specializations',
  achievements: 'achievements',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchoolScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  registrationNumber: 'registrationNumber',
  license: 'license',
  contact: 'contact',
  address: 'address',
  facilities: 'facilities',
  capacity: 'capacity',
  curriculum: 'curriculum',
  languages: 'languages',
  operatingHours: 'operatingHours',
  termDates: 'termDates',
  verificationStatus: 'verificationStatus',
  verifiedAt: 'verifiedAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  settings: 'settings',
  communicationSettings: 'communicationSettings',
  createdBy: 'createdBy',
  ownershipDetails: 'ownershipDetails',
  systemApproval: 'systemApproval'
};

exports.Prisma.StaffAssignmentScalarFieldEnum = {
  id: 'id',
  staffProfileId: 'staffProfileId',
  schoolId: 'schoolId',
  role: 'role',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParentStudentRelationScalarFieldEnum = {
  id: 'id',
  parentProfileId: 'parentProfileId',
  studentProfileId: 'studentProfileId',
  relationship: 'relationship',
  isPrimary: 'isPrimary',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClassSubjectScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  subjectId: 'subjectId',
  staffProfileId: 'staffProfileId',
  schoolId: 'schoolId',
  schedule: 'schedule',
  syllabus: 'syllabus',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  academicYear: 'academicYear',
  term: 'term',
  maxStudents: 'maxStudents',
  currentEnrollment: 'currentEnrollment'
};

exports.Prisma.ClassScalarFieldEnum = {
  id: 'id',
  name: 'name',
  grade: 'grade',
  section: 'section',
  academicYear: 'academicYear',
  capacity: 'capacity',
  schedule: 'schedule',
  schoolId: 'schoolId',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  classMasterId: 'classMasterId',
  classMasterHistory: 'classMasterHistory'
};

exports.Prisma.ClassStudentScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  studentProfileId: 'studentProfileId',
  enrollmentDate: 'enrollmentDate',
  status: 'status',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportCardScalarFieldEnum = {
  id: 'id',
  studentProfileId: 'studentProfileId',
  schoolId: 'schoolId',
  term: 'term',
  academicYear: 'academicYear',
  teacherComments: 'teacherComments',
  principalComments: 'principalComments',
  attendance: 'attendance',
  status: 'status',
  publishedAt: 'publishedAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GradeScalarFieldEnum = {
  id: 'id',
  studentProfileId: 'studentProfileId',
  reportCardId: 'reportCardId',
  subjectId: 'subjectId',
  teacherId: 'teacherId',
  grade: 'grade',
  comments: 'comments',
  assessmentType: 'assessmentType',
  assessmentDate: 'assessmentDate',
  status: 'status',
  staffProfileId: 'staffProfileId',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  term: 'term',
  academicYear: 'academicYear',
  weightage: 'weightage'
};

exports.Prisma.StudentProfileScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  admissionNumber: 'admissionNumber',
  enrollmentDate: 'enrollmentDate',
  currentGrade: 'currentGrade',
  previousSchools: 'previousSchools',
  learningProgress: 'learningProgress',
  achievements: 'achievements',
  extracurricular: 'extracurricular',
  specialNeeds: 'specialNeeds',
  medicalInfo: 'medicalInfo',
  dietaryRestrictions: 'dietaryRestrictions',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currentGPA: 'currentGPA',
  academicStanding: 'academicStanding',
  attendanceRate: 'attendanceRate',
  lastAttendanceDate: 'lastAttendanceDate'
};

exports.Prisma.ParentProfileScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  relationship: 'relationship',
  preferredLanguage: 'preferredLanguage',
  communicationPreferences: 'communicationPreferences',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  studentProfileId: 'studentProfileId',
  date: 'date',
  status: 'status',
  timeIn: 'timeIn',
  timeOut: 'timeOut',
  reason: 'reason',
  isExcused: 'isExcused',
  notes: 'notes',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  term: 'term',
  academicYear: 'academicYear',
  verifiedBy: 'verifiedBy',
  classMasterId: 'classMasterId',
  classId: 'classId',
  recordedBy: 'recordedBy',
  modifiedBy: 'modifiedBy',
  modifiedAt: 'modifiedAt',
  verificationNotes: 'verificationNotes'
};

exports.Prisma.StaffProfileScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  employeeId: 'employeeId',
  position: 'position',
  department: 'department',
  employmentType: 'employmentType',
  startDate: 'startDate',
  endDate: 'endDate',
  schedule: 'schedule',
  responsibilities: 'responsibilities',
  teachingHours: 'teachingHours',
  specializations: 'specializations'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  category: 'category',
  gradeLevel: 'gradeLevel',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  credits: 'credits',
  prerequisites: 'prerequisites',
  corequisites: 'corequisites',
  learningOutcomes: 'learningOutcomes',
  assessmentCriteria: 'assessmentCriteria'
};

exports.Prisma.SubjectAssignmentScalarFieldEnum = {
  id: 'id',
  subjectId: 'subjectId',
  staffProfileId: 'staffProfileId',
  academicYear: 'academicYear',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommunicationGroupScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  name: 'name',
  type: 'type',
  filters: 'filters',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchoolRoleScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  userId: 'userId',
  role: 'role',
  permissions: 'permissions',
  communicationPermissions: 'communicationPermissions',
  assignedBy: 'assignedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  originalName: 'originalName',
  mimeType: 'mimeType',
  size: 'size',
  url: 'url',
  type: 'type',
  category: 'category',
  accessLevel: 'accessLevel',
  provider: 'provider',
  metadata: 'metadata',
  ownerId: 'ownerId',
  ownerType: 'ownerType',
  accessibleTo: 'accessibleTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.FileQuotaScalarFieldEnum = {
  id: 'id',
  fileId: 'fileId',
  totalSize: 'totalSize',
  usedSize: 'usedSize',
  maxSize: 'maxSize',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserStatus = exports.$Enums.UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE'
};

exports.VerificationStatus = exports.$Enums.VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

exports.EmploymentEligibilityStatus = exports.$Enums.EmploymentEligibilityStatus = {
  NOT_CHECKED: 'NOT_CHECKED',
  ELIGIBLE: 'ELIGIBLE',
  INELIGIBLE: 'INELIGIBLE',
  PENDING_REVIEW: 'PENDING_REVIEW'
};

exports.Role = exports.$Enums.Role = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  SCHOOL_OWNER: 'SCHOOL_OWNER',
  SCHOOL_HEAD: 'SCHOOL_HEAD',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  ACCOUNTANT: 'ACCOUNTANT',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  CHEF: 'CHEF',
  SECURITY: 'SECURITY',
  TRANSPORT_OFFICER: 'TRANSPORT_OFFICER',
  KYC_OFFICER: 'KYC_OFFICER',
  OTHER: 'OTHER'
};

exports.OTPStatus = exports.$Enums.OTPStatus = {
  PENDING: 'PENDING',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
};

exports.DocumentType = exports.$Enums.DocumentType = {
  IDENTITY: 'IDENTITY',
  SCHOOL_LICENSE: 'SCHOOL_LICENSE',
  EMPLOYMENT_PROOF: 'EMPLOYMENT_PROOF',
  QUALIFICATION: 'QUALIFICATION'
};

exports.EntityType = exports.$Enums.EntityType = {
  USER: 'USER',
  SCHOOL: 'SCHOOL'
};

exports.OccupationType = exports.$Enums.OccupationType = {
  EDUCATION_SECTOR: 'EDUCATION_SECTOR',
  HEALTHCARE: 'HEALTHCARE',
  TRANSPORTATION: 'TRANSPORTATION',
  CONSTRUCTION: 'CONSTRUCTION',
  BUSINESS: 'BUSINESS',
  TECHNOLOGY: 'TECHNOLOGY',
  GOVERNMENT: 'GOVERNMENT',
  SELF_EMPLOYED: 'SELF_EMPLOYED',
  OTHER: 'OTHER'
};

exports.ReportCardStatus = exports.$Enums.ReportCardStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  AVAILABLE: 'AVAILABLE'
};

exports.GradeStatus = exports.$Enums.GradeStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED'
};

exports.FileType = exports.$Enums.FileType = {
  DOCUMENT: 'DOCUMENT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  OTHER: 'OTHER'
};

exports.FileCategory = exports.$Enums.FileCategory = {
  PROFILE_PICTURE: 'PROFILE_PICTURE',
  KYC_DOCUMENT: 'KYC_DOCUMENT',
  SCHOOL_DOCUMENT: 'SCHOOL_DOCUMENT',
  STUDENT_WORK: 'STUDENT_WORK',
  COURSE_MATERIAL: 'COURSE_MATERIAL',
  OTHER: 'OTHER'
};

exports.FileAccessLevel = exports.$Enums.FileAccessLevel = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  RESTRICTED: 'RESTRICTED'
};

exports.StorageProvider = exports.$Enums.StorageProvider = {
  LOCAL: 'LOCAL',
  CLOUDINARY: 'CLOUDINARY',
  S3: 'S3'
};

exports.Prisma.ModelName = {
  User: 'User',
  OTP: 'OTP',
  RefreshToken: 'RefreshToken',
  KYCDocument: 'KYCDocument',
  VerificationHistory: 'VerificationHistory',
  Profile: 'Profile',
  ProfessionalProfile: 'ProfessionalProfile',
  School: 'School',
  StaffAssignment: 'StaffAssignment',
  ParentStudentRelation: 'ParentStudentRelation',
  ClassSubject: 'ClassSubject',
  Class: 'Class',
  ClassStudent: 'ClassStudent',
  ReportCard: 'ReportCard',
  Grade: 'Grade',
  StudentProfile: 'StudentProfile',
  ParentProfile: 'ParentProfile',
  Attendance: 'Attendance',
  StaffProfile: 'StaffProfile',
  Subject: 'Subject',
  SubjectAssignment: 'SubjectAssignment',
  CommunicationGroup: 'CommunicationGroup',
  SchoolRole: 'SchoolRole',
  File: 'File',
  FileQuota: 'FileQuota'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
