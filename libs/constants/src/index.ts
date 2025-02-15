export * from './http-status';
export * from './error-codes';
export * from './academic';

export const EVENT_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  MFA_SETUP: 'MFA_SETUP',
  MFA_VERIFICATION: 'MFA_VERIFICATION',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  ROLE_CHANGE: 'ROLE_CHANGE',
  USER_UPDATED: 'USER_UPDATED'
} as const;
