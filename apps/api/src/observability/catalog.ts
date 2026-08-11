/**
 * Stable catalogs for audit actions and internal error codes (Phase 2).
 * Keep string unions narrow — add values deliberately.
 */

export const AUDIT_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_REGISTER',
  'INVITE_CREATED',
  'EMAIL_BROADCAST',
  'ATTENDANCE_MARKED',
  'GRADE_UPSERT',
  'SHEET_SUBMITTED',
  'SHEET_APPROVED',
  'SHEET_CHANGES_REQUESTED',
  'NOTE_CREATED',
  'NOTE_UPDATED',
  'NOTE_DELETED',
  'NOTE_ATTACHMENT_ADDED',
  'NOTE_ATTACHMENT_DELETED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'GROUP_LINKS_UPDATED',
  'GROUP_TUTOR_UPDATED',
  'GROUP_SPRINT_STATUS_UPDATED',
  'SCHEDULE_SESSION_CREATED',
  'SCHEDULE_SESSION_UPDATED',
  'SCHEDULE_SESSION_DELETED',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const ERROR_CODES = [
  'CT_VALIDATION',
  'CT_AUTH',
  'CT_FORBIDDEN',
  'CT_NOT_FOUND',
  'CT_CONFLICT',
  'CT_BUSINESS',
  'CT_DB',
  'CT_DB_UNIQUE',
  'CT_EXTERNAL',
  'CT_UNEXPECTED',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export const OBSERVABILITY_SERVICE_API = 'classtrack-api'
export const OBSERVABILITY_SERVICE_WEB = 'classtrack-web'
