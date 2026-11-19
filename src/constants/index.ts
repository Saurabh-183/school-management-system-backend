export const SESSION_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  COMPLETED: 'COMPLETED',
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
