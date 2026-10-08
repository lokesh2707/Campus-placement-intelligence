import { Router } from 'express';
import { adminStudentController } from '../controllers/admin-student.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  adminStudentQuerySchema,
  adminStudentUpdateSchema,
  academicVerificationSchema,
} from '@campus-os/validation';
import { UserRole } from '@campus-os/shared-types';

export const adminStudentRouter = Router();

const ALLOWED_ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.PLACEMENT_ADMIN,
  UserRole.DEPARTMENT_COORDINATOR,
  UserRole.PLACEMENT_COORDINATOR,
];

adminStudentRouter.get(
  '/admin/students',
  requireAuth,
  requireRoles(...ALLOWED_ADMIN_ROLES),
  validateQuery(adminStudentQuerySchema),
  adminStudentController.listStudents
);

adminStudentRouter.get(
  '/admin/students/:id',
  requireAuth,
  requireRoles(...ALLOWED_ADMIN_ROLES),
  adminStudentController.getStudentById
);

adminStudentRouter.patch(
  '/admin/students/:id',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN, UserRole.DEPARTMENT_COORDINATOR),
  validateBody(adminStudentUpdateSchema),
  adminStudentController.updateStudent
);

adminStudentRouter.post(
  '/admin/students/:id/verify',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN, UserRole.DEPARTMENT_COORDINATOR),
  validateBody(academicVerificationSchema),
  adminStudentController.verifyStudentAcademic
);
