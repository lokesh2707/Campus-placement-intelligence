import { Router } from 'express';
import multer from 'multer';
import { companyController } from '../controllers/company.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createCompanySchema,
  updateCompanySchema,
  verifyCompanySchema,
  companyContactSchema,
  updateCompanyContactSchema,
  updateCompanyHiringPreferenceSchema,
  verifyCompanyDocumentSchema,
} from '@campus-os/validation';
import { UserRole } from '@campus-os/shared-types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
});

export const companyRouter = Router();

// ================= COMPANIES CRUD =================

companyRouter.post(
  '/companies',
  requireAuth,
  validateBody(createCompanySchema),
  companyController.createCompany
);

companyRouter.get('/companies', requireAuth, companyController.listCompanies);
companyRouter.get('/companies/:id', requireAuth, companyController.getCompanyById);

companyRouter.patch(
  '/companies/:id',
  requireAuth,
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

companyRouter.delete(
  '/companies/:id',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  companyController.deleteCompany
);

// ================= VERIFICATION & LIFECYCLE =================

companyRouter.post(
  '/companies/:id/verify',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyCompanySchema),
  companyController.verifyCompany
);

companyRouter.post(
  '/companies/:id/reject',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyCompanySchema),
  companyController.rejectCompany
);

companyRouter.post(
  '/companies/:id/suspend',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  companyController.suspendCompany
);

companyRouter.post(
  '/companies/:id/activate',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  companyController.activateCompany
);

companyRouter.post(
  '/companies/:id/logo',
  requireAuth,
  upload.single('logo'),
  companyController.uploadLogo
);

// ================= CONTACTS =================

companyRouter.get(
  '/companies/:companyId/contacts',
  requireAuth,
  companyController.getContacts
);

companyRouter.post(
  '/companies/:companyId/contacts',
  requireAuth,
  validateBody(companyContactSchema),
  companyController.createContact
);

companyRouter.patch(
  '/companies/:companyId/contacts/:contactId',
  requireAuth,
  validateBody(updateCompanyContactSchema),
  companyController.updateContact
);

companyRouter.delete(
  '/companies/:companyId/contacts/:contactId',
  requireAuth,
  companyController.deleteContact
);

// ================= DOCUMENTS =================

companyRouter.get(
  '/companies/:companyId/documents',
  requireAuth,
  companyController.getDocuments
);

companyRouter.post(
  '/companies/:companyId/documents',
  requireAuth,
  upload.single('document'),
  companyController.uploadDocument
);

companyRouter.post(
  '/companies/:companyId/documents/:documentId/verify',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyCompanyDocumentSchema),
  companyController.verifyDocument
);

companyRouter.post(
  '/companies/:companyId/documents/:documentId/reject',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN),
  validateBody(verifyCompanyDocumentSchema),
  companyController.rejectDocument
);

companyRouter.delete(
  '/companies/:companyId/documents/:documentId',
  requireAuth,
  companyController.deleteDocument
);

companyRouter.get(
  '/companies/:companyId/documents/:documentId/download',
  requireAuth,
  companyController.downloadDocument
);

// ================= HIRING PREFERENCES =================

companyRouter.get(
  '/companies/:companyId/preferences',
  requireAuth,
  companyController.getPreferences
);

companyRouter.patch(
  '/companies/:companyId/preferences',
  requireAuth,
  validateBody(updateCompanyHiringPreferenceSchema),
  companyController.updatePreferences
);
