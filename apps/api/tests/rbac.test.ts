import { describe, it, expect } from 'vitest';
import { UserRole } from '@campus-os/shared-types';
import { Permissions, hasPermission } from '@campus-os/config';
import { canAccessResource } from '../src/middleware/auth.middleware.js';

describe('Role-Based Access Control & Object-Level Authorization', () => {
  it('correctly maps SUPER_ADMIN privileges across all domains', () => {
    expect(hasPermission(UserRole.SUPER_ADMIN, Permissions.ADMIN_MANAGE_USERS)).toBe(true);
    expect(hasPermission(UserRole.SUPER_ADMIN, Permissions.DRIVE_CREATE)).toBe(true);
    expect(hasPermission(UserRole.SUPER_ADMIN, Permissions.STUDENT_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.SUPER_ADMIN, Permissions.ANALYTICS_READ)).toBe(true);
  });

  it('correctly restricts STUDENT privileges to own domain actions', () => {
    expect(hasPermission(UserRole.STUDENT, Permissions.USER_READ_SELF)).toBe(true);
    expect(hasPermission(UserRole.STUDENT, Permissions.APPLICATIONS_SUBMIT)).toBe(true);
    expect(hasPermission(UserRole.STUDENT, Permissions.APPLICATIONS_VIEW_OWN)).toBe(true);

    // Forbidden actions
    expect(hasPermission(UserRole.STUDENT, Permissions.ADMIN_MANAGE_USERS)).toBe(false);
    expect(hasPermission(UserRole.STUDENT, Permissions.DRIVE_CREATE)).toBe(false);
    expect(hasPermission(UserRole.STUDENT, Permissions.COMPANIES_MANAGE)).toBe(false);
  });

  it('correctly grants RECRUITER permissions for job applications and offers', () => {
    expect(hasPermission(UserRole.RECRUITER, Permissions.APPLICATION_READ)).toBe(true);
    expect(hasPermission(UserRole.RECRUITER, Permissions.INTERVIEWS_SCHEDULE)).toBe(true);
    expect(hasPermission(UserRole.RECRUITER, Permissions.OFFERS_ISSUE)).toBe(true);
    expect(hasPermission(UserRole.RECRUITER, Permissions.ADMIN_MANAGE_USERS)).toBe(false);
  });

  describe('Object-Level Resource Authorization (canAccessResource)', () => {
    const studentUser = {
      sub: 'student-id-123',
      userId: 'student-id-123',
      email: 'student@campus.edu',
      role: UserRole.STUDENT,
      sessionId: 'sess-1',
    };

    const adminUser = {
      sub: 'admin-id-456',
      userId: 'admin-id-456',
      email: 'admin@campus.edu',
      role: UserRole.PLACEMENT_ADMIN,
      sessionId: 'sess-2',
    };

    it('allows a user to access their own resource', () => {
      expect(canAccessResource(studentUser, 'student-id-123')).toBe(true);
    });

    it('prevents a user from accessing another users resource', () => {
      expect(canAccessResource(studentUser, 'another-student-id-999')).toBe(false);
    });

    it('allows an administrator to access any users resource', () => {
      expect(canAccessResource(adminUser, 'student-id-123')).toBe(true);
      expect(canAccessResource(adminUser, 'another-student-id-999')).toBe(true);
    });
  });
});
