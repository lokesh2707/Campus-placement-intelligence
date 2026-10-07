import { UserRole } from '@campus-os/shared-types';

export type Permission =
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
    'system:manage',
    'colleges:manage',
    'departments:manage',
    'students:manage',
    'companies:manage',
    'recruiters:manage',
    'drives:manage',
    'drives:read',
    'applications:manage',
    'interviews:schedule',
    'offers:issue',
    'analytics:view_college',
    'audit_logs:read',
    'ai:request_insights',
  ],
  [UserRole.PLACEMENT_ADMIN]: [
    'colleges:manage',
    'departments:manage',
    'students:manage',
    'companies:manage',
    'recruiters:manage',
    'drives:create',
    'drives:manage',
    'drives:read',
    'applications:manage',
    'interviews:schedule',
    'offers:issue',
    'analytics:view_college',
    'audit_logs:read',
    'ai:request_insights',
  ],
  [UserRole.PLACEMENT_COORDINATOR]: [
    'students:read',
    'drives:manage',
    'drives:read',
    'applications:manage',
    'interviews:schedule',
    'analytics:view_college',
    'ai:request_insights',
  ],
  [UserRole.DEPARTMENT_COORDINATOR]: [
    'students:department_only',
    'drives:read',
    'analytics:view_department',
  ],
  [UserRole.RECRUITER]: [
    'drives:read',
    'applications:manage',
    'interviews:schedule',
    'interviews:feedback',
    'offers:issue',
    'ai:request_insights',
  ],
  [UserRole.STUDENT]: [
    'drives:read',
    'applications:submit',
    'applications:view_own',
    'interviews:view_own',
    'offers:view_own',
    'ai:request_insights',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
