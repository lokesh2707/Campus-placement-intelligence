import { UserRole } from '@campus-os/shared-types';

export const Permissions = {
  // Foundational Self Permissions
  USER_READ_SELF: 'USER_READ_SELF',
  USER_UPDATE_SELF: 'USER_UPDATE_SELF',

  // Administration
  ADMIN_MANAGE_USERS: 'ADMIN_MANAGE_USERS',
  SYSTEM_MANAGE: 'system:manage',
  COLLEGES_MANAGE: 'colleges:manage',
  DEPARTMENTS_MANAGE: 'departments:manage',

  // Student Profiles
  STUDENT_READ: 'STUDENT_READ',
  STUDENT_UPDATE: 'STUDENT_UPDATE',
  STUDENT_MANAGE: 'students:manage',
  STUDENTS_DEPARTMENT_ONLY: 'students:department_only',

  // Companies & Recruiters
  COMPANY_CREATE: 'COMPANY_CREATE',
  COMPANY_READ: 'COMPANY_READ',
  COMPANY_UPDATE: 'COMPANY_UPDATE',
  COMPANIES_MANAGE: 'companies:manage',
  RECRUITERS_MANAGE: 'recruiters:manage',

  // Placement Drives
  DRIVE_CREATE: 'DRIVE_CREATE',
  DRIVE_READ: 'DRIVE_READ',
  DRIVE_UPDATE: 'DRIVE_UPDATE',
  DRIVES_MANAGE: 'drives:manage',

  // Applications
  APPLICATION_READ: 'APPLICATION_READ',
  APPLICATION_UPDATE: 'APPLICATION_UPDATE',
  APPLICATIONS_SUBMIT: 'applications:submit',
  APPLICATIONS_VIEW_OWN: 'applications:view_own',
  APPLICATIONS_MANAGE: 'applications:manage',

  // Interviews & Offers
  INTERVIEWS_SCHEDULE: 'interviews:schedule',
  INTERVIEWS_VIEW_OWN: 'interviews:view_own',
  INTERVIEWS_FEEDBACK: 'interviews:feedback',
  OFFERS_ISSUE: 'offers:issue',
  OFFERS_VIEW_OWN: 'offers:view_own',

  // Analytics & Audits
  ANALYTICS_READ: 'ANALYTICS_READ',
  ANALYTICS_VIEW_COLLEGE: 'analytics:view_college',
  ANALYTICS_VIEW_DEPARTMENT: 'analytics:view_department',
  AUDIT_LOGS_READ: 'audit_logs:read',

  // AI Insights
  AI_REQUEST_INSIGHTS: 'ai:request_insights',
} as const;

export type Permission =
  | (typeof Permissions)[keyof typeof Permissions]
  | 'system:manage'
  | 'colleges:manage'
  | 'departments:manage'
  | 'students:read'
  | 'students:manage'
  | 'students:department_only'
  | 'companies:manage'
  | 'recruiters:manage'
  | 'drives:create'
  | 'drives:manage'
  | 'drives:read'
  | 'applications:submit'
  | 'applications:view_own'
  | 'applications:manage'
  | 'interviews:schedule'
  | 'interviews:view_own'
  | 'interviews:feedback'
  | 'offers:issue'
  | 'offers:view_own'
  | 'analytics:view_college'
  | 'analytics:view_department'
  | 'audit_logs:read'
  | 'ai:request_insights';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.ADMIN_MANAGE_USERS,
    Permissions.SYSTEM_MANAGE,
    Permissions.COLLEGES_MANAGE,
    Permissions.DEPARTMENTS_MANAGE,
    Permissions.STUDENT_READ,
    Permissions.STUDENT_UPDATE,
    Permissions.STUDENT_MANAGE,
    Permissions.COMPANY_CREATE,
    Permissions.COMPANY_READ,
    Permissions.COMPANY_UPDATE,
    Permissions.COMPANIES_MANAGE,
    Permissions.RECRUITERS_MANAGE,
    Permissions.DRIVE_CREATE,
    Permissions.DRIVE_READ,
    Permissions.DRIVE_UPDATE,
    Permissions.DRIVES_MANAGE,
    Permissions.APPLICATION_READ,
    Permissions.APPLICATION_UPDATE,
    Permissions.APPLICATIONS_MANAGE,
    Permissions.INTERVIEWS_SCHEDULE,
    Permissions.OFFERS_ISSUE,
    Permissions.ANALYTICS_READ,
    Permissions.ANALYTICS_VIEW_COLLEGE,
    Permissions.AUDIT_LOGS_READ,
    Permissions.AI_REQUEST_INSIGHTS,
  ],
  [UserRole.PLACEMENT_ADMIN]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.COLLEGES_MANAGE,
    Permissions.DEPARTMENTS_MANAGE,
    Permissions.STUDENT_READ,
    Permissions.STUDENT_UPDATE,
    Permissions.STUDENT_MANAGE,
    Permissions.COMPANY_CREATE,
    Permissions.COMPANY_READ,
    Permissions.COMPANY_UPDATE,
    Permissions.COMPANIES_MANAGE,
    Permissions.RECRUITERS_MANAGE,
    Permissions.DRIVE_CREATE,
    Permissions.DRIVE_READ,
    Permissions.DRIVE_UPDATE,
    Permissions.DRIVES_MANAGE,
    Permissions.APPLICATION_READ,
    Permissions.APPLICATION_UPDATE,
    Permissions.APPLICATIONS_MANAGE,
    Permissions.INTERVIEWS_SCHEDULE,
    Permissions.OFFERS_ISSUE,
    Permissions.ANALYTICS_READ,
    Permissions.ANALYTICS_VIEW_COLLEGE,
    Permissions.AUDIT_LOGS_READ,
    Permissions.AI_REQUEST_INSIGHTS,
  ],
  [UserRole.PLACEMENT_COORDINATOR]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.STUDENT_READ,
    'students:read',
    Permissions.DRIVE_READ,
    Permissions.DRIVES_MANAGE,
    'drives:manage',
    'drives:read',
    Permissions.APPLICATION_READ,
    Permissions.APPLICATION_UPDATE,
    Permissions.APPLICATIONS_MANAGE,
    'applications:manage',
    Permissions.INTERVIEWS_SCHEDULE,
    'interviews:schedule',
    Permissions.ANALYTICS_READ,
    Permissions.ANALYTICS_VIEW_COLLEGE,
    'analytics:view_college',
    Permissions.AI_REQUEST_INSIGHTS,
    'ai:request_insights',
  ],
  [UserRole.DEPARTMENT_COORDINATOR]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.STUDENT_READ,
    Permissions.STUDENTS_DEPARTMENT_ONLY,
    'students:department_only',
    Permissions.DRIVE_READ,
    'drives:read',
    Permissions.ANALYTICS_READ,
    Permissions.ANALYTICS_VIEW_DEPARTMENT,
    'analytics:view_department',
  ],
  [UserRole.RECRUITER]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.COMPANY_READ,
    Permissions.COMPANY_UPDATE,
    Permissions.DRIVE_READ,
    'drives:read',
    Permissions.APPLICATION_READ,
    Permissions.APPLICATION_UPDATE,
    Permissions.APPLICATIONS_MANAGE,
    'applications:manage',
    Permissions.INTERVIEWS_SCHEDULE,
    'interviews:schedule',
    Permissions.INTERVIEWS_FEEDBACK,
    'interviews:feedback',
    Permissions.OFFERS_ISSUE,
    'offers:issue',
    Permissions.AI_REQUEST_INSIGHTS,
    'ai:request_insights',
  ],
  [UserRole.STUDENT]: [
    Permissions.USER_READ_SELF,
    Permissions.USER_UPDATE_SELF,
    Permissions.DRIVE_READ,
    'drives:read',
    Permissions.APPLICATION_READ,
    Permissions.APPLICATIONS_SUBMIT,
    'applications:submit',
    Permissions.APPLICATIONS_VIEW_OWN,
    'applications:view_own',
    Permissions.INTERVIEWS_VIEW_OWN,
    'interviews:view_own',
    Permissions.OFFERS_VIEW_OWN,
    'offers:view_own',
    Permissions.AI_REQUEST_INSIGHTS,
    'ai:request_insights',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
