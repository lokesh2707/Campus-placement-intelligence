export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLACEMENT_ADMIN = 'PLACEMENT_ADMIN',
  PLACEMENT_COORDINATOR = 'PLACEMENT_COORDINATOR',
  DEPARTMENT_COORDINATOR = 'DEPARTMENT_COORDINATOR',
  RECRUITER = 'RECRUITER',
  STUDENT = 'STUDENT',
}

export type RoleName = keyof typeof UserRole;

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  collegeId?: string;
  departmentId?: string;
  companyId?: string;
}
