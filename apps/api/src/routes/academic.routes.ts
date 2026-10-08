import { Router } from 'express';
import { academicController } from '../controllers/academic.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createCollegeSchema,
  createCampusSchema,
  createDepartmentSchema,
  createDegreeSchema,
  createBatchSchema,
} from '@campus-os/validation';
import { UserRole } from '@campus-os/shared-types';

export const academicRouter = Router();

// Colleges
academicRouter.get('/colleges', academicController.getColleges);
academicRouter.get('/colleges/:id', requireAuth, academicController.getCollegeById);
academicRouter.post(
  '/colleges',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(createCollegeSchema),
  academicController.createCollege
);

// Campuses
academicRouter.get('/campuses', academicController.getCampuses);
academicRouter.post(
  '/campuses',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(createCampusSchema),
  academicController.createCampus
);

// Departments
academicRouter.get('/departments', academicController.getDepartments);
academicRouter.post(
  '/departments',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(createDepartmentSchema),
  academicController.createDepartment
);

// Degrees
academicRouter.get('/degrees', academicController.getDegrees);
academicRouter.post(
  '/degrees',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(createDegreeSchema),
  academicController.createDegree
);

// Batches
academicRouter.get('/batches', academicController.getBatches);
academicRouter.post(
  '/batches',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(createBatchSchema),
  academicController.createBatch
);
