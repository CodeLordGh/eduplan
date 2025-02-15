import { Option } from 'fp-ts/Option'
import { Either } from 'fp-ts/Either'

export type MFAType = 'OTP' | 'EMAIL' | 'SMS'

export type MFAConfig = Readonly<{
  type: MFAType
  isEnabled: boolean
  verifiedAt: Option<Date>
}>

export type SessionData = Readonly<{
  id: string
  userId: string
  deviceInfo: string
  ipAddress: string
  lastActive: Date
  mfaVerified: boolean
}>

export type AuthError = 
  | { _tag: 'InvalidCredentials' }
  | { _tag: 'MFARequired' }
  | { _tag: 'SessionExpired' }

export type Credentials = Readonly<{
  email: string
  password: string
}>

export type OTPPurpose =
  | 'REGISTRATION'
  | 'PASSWORD_RESET'
  | 'MFA'
  | 'ACCOUNT_LINKING'
  | 'ROLE_DELEGATION'

export type OTPData = Readonly<{
  code: string
  purpose: OTPPurpose
  expiresAt: number
  metadata: Record<string, unknown>
}>

export type AuthContext = Readonly<{
  schoolId?: string
  departmentId?: string
  programId?: string
  resourceOwnerId?: string
}>

export type AccessRequest = Readonly<{
  userId: string
  permission: string
  context: AuthContext
}>

export type AuthEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'MFA_SETUP'
  | 'MFA_VERIFICATION'
  | 'TOKEN_REFRESH'
  | 'ROLE_CHANGE'

export type AuditEvent = Readonly<{
  eventType: AuthEventType
  userId: string
  metadata: Record<string, unknown>
  timestamp: Date
  status: 'SUCCESS' | 'FAILURE'
  ipAddress: string
  userAgent: string
}> 