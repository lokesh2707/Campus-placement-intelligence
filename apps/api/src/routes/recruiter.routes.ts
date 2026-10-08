import { Router } from 'express';
import { recruiterController } from '../controllers/recruiter.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  inviteRecruiterSchema,
  acceptRecruiterInvitationSchema,
  updateRecruiterProfileSchema,
  verifyRecruiterSchema,
} from '@campus-os/validation';
import { UserRole } from '@campus-os/shared-types';

export const recruiterRouter = Router();

// Recruiter Self-service
recruiterRouter.get(
  '/recruiters/me',
  requireAuth,
  requireRoles(UserRole.RECRUITER),
  recruiterController.getRecruiterMe
);

recruiterRouter.patch(
  '/recruiters/me',
  requireAuth,
  requireRoles(UserRole.RECRUITER),
  validateBody(updateRecruiterProfileSchema),
  recruiterController.updateRecruiterMe
);

// Invitation workflow
recruiterRouter.post(
  '/companies/:companyId/recruiters/invite',
  requireAuth,
  validateBody(inviteRecruiterSchema),
  recruiterController.inviteRecruiter
);

recruiterRouter.post(
  '/recruiters/accept-invitation',
  validateBody(acceptRecruiterInvitationSchema),
  recruiterController.acceptInvitation
);

// Admin & Directory
recruiterRouter.get('/recruiters', requireAuth, recruiterController.listRecruiters);
recruiterRouter.get('/recruiters/:id', requireAuth, recruiterController.getRecruiterById);

// Verification and status
recruiterRouter.post(
  '/recruiters/:id/verify',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyRecruiterSchema),
  recruiterController.verifyRecruiter
);

recruiterRouter.post(
  '/recruiters/:id/reject',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyRecruiterSchema),
  recruiterController.rejectRecruiter
);

recruiterRouter.post(
  '/recruiters/:id/suspend',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  recruiterController.suspendRecruiter
);

recruiterRouter.post(
  '/recruiters/:id/activate',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  recruiterController.activateRecruiter
);
