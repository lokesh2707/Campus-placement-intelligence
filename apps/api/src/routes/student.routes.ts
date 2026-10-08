import { Router } from 'express';
import multer from 'multer';
import { studentController } from '../controllers/student.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createStudentProfileSchema,
  studentSelfUpdateSchema,
  addStudentSkillSchema,
  updateStudentSkillSchema,
  projectSchema,
  updateProjectSchema,
  internshipSchema,
  updateInternshipSchema,
  certificationSchema,
  updateCertificationSchema,
  careerPreferenceSchema,
} from '@campus-os/validation';
import { UserRole } from '@campus-os/shared-types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
});

export const studentRouter = Router();

// Taxonomy Skills (public or authenticated)
studentRouter.get('/skills', studentController.listTaxonomySkills);

// Profile
studentRouter.get('/students/me', requireAuth, studentController.getMyProfile);
studentRouter.post(
  '/students/profile',
  requireAuth,
  validateBody(createStudentProfileSchema),
  studentController.createProfile
);
studentRouter.patch(
  '/students/me',
  requireAuth,
  validateBody(studentSelfUpdateSchema),
  studentController.updateMyProfile
);
studentRouter.get(
  '/students/:id',
  requireAuth,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN, UserRole.DEPARTMENT_COORDINATOR, UserRole.PLACEMENT_COORDINATOR),
  studentController.getStudentById
);

// Skills
studentRouter.get('/students/me/skills', requireAuth, studentController.getMySkills);
studentRouter.post(
  '/students/me/skills',
  requireAuth,
  validateBody(addStudentSkillSchema),
  studentController.addSkill
);
studentRouter.patch(
  '/students/me/skills/:skillId',
  requireAuth,
  validateBody(updateStudentSkillSchema),
  studentController.updateSkill
);
studentRouter.delete('/students/me/skills/:skillId', requireAuth, studentController.removeSkill);

// Projects
studentRouter.get('/students/me/projects', requireAuth, studentController.getMyProjects);
studentRouter.post(
  '/students/me/projects',
  requireAuth,
  validateBody(projectSchema),
  studentController.addProject
);
studentRouter.patch(
  '/students/me/projects/:id',
  requireAuth,
  validateBody(updateProjectSchema),
  studentController.updateProject
);
studentRouter.delete('/students/me/projects/:id', requireAuth, studentController.deleteProject);

// Internships
studentRouter.get('/students/me/internships', requireAuth, studentController.getMyInternships);
studentRouter.post(
  '/students/me/internships',
  requireAuth,
  validateBody(internshipSchema),
  studentController.addInternship
);
studentRouter.patch(
  '/students/me/internships/:id',
  requireAuth,
  validateBody(updateInternshipSchema),
  studentController.updateInternship
);
studentRouter.delete('/students/me/internships/:id', requireAuth, studentController.deleteInternship);

// Certifications
studentRouter.get('/students/me/certifications', requireAuth, studentController.getMyCertifications);
studentRouter.post(
  '/students/me/certifications',
  requireAuth,
  validateBody(certificationSchema),
  studentController.addCertification
);
studentRouter.patch(
  '/students/me/certifications/:id',
  requireAuth,
  validateBody(updateCertificationSchema),
  studentController.updateCertification
);
studentRouter.delete('/students/me/certifications/:id', requireAuth, studentController.deleteCertification);

// Career Preferences
studentRouter.get('/students/me/preferences', requireAuth, studentController.getCareerPreferences);
studentRouter.put(
  '/students/me/preferences',
  requireAuth,
  validateBody(careerPreferenceSchema),
  studentController.updateCareerPreferences
);

// Resumes
studentRouter.get('/students/me/resumes', requireAuth, studentController.getMyResumes);
studentRouter.post(
  '/students/me/resumes',
  requireAuth,
  upload.single('file'),
  studentController.uploadResume
);
studentRouter.patch('/students/me/resumes/:id/activate', requireAuth, studentController.setActiveResume);
studentRouter.delete('/students/me/resumes/:id', requireAuth, studentController.deleteResume);
studentRouter.get('/resumes/:id/download', requireAuth, studentController.downloadResume);
