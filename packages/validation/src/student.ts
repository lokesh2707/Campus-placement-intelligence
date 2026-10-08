import { z } from 'zod';
import { AcademicVerificationStatus, SkillProficiency, WorkPreference } from '@campus-os/shared-types';

export const studentSelfUpdateSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  profilePhoto: z.string().url().optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
});

export const createStudentProfileSchema = z.object({
  studentId: z.string().min(2, 'Registration number is required').max(50),
  collegeId: z.string().uuid('Invalid college ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  degreeId: z.string().uuid('Invalid degree ID'),
  batchId: z.string().uuid('Invalid batch ID'),
  graduationYear: z.number().int().min(2000).max(2100),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  tenthPercentage: z.number().min(0).max(100).optional().nullable(),
  twelfthPercentage: z.number().min(0).max(100).optional().nullable(),
  diplomaPercentage: z.number().min(0).max(100).optional().nullable(),
  backlogs: z.number().int().min(0).default(0),
  activeBacklogs: z.number().int().min(0).default(0),
  bio: z.string().max(1000).optional().nullable(),
  profilePhoto: z.string().url().optional().nullable().or(z.literal('')),
});

export const adminStudentUpdateSchema = z.object({
  studentId: z.string().min(2).max(50).optional(),
  collegeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  degreeId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
  phone: z.string().max(20).optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  tenthPercentage: z.number().min(0).max(100).optional().nullable(),
  twelfthPercentage: z.number().min(0).max(100).optional().nullable(),
  diplomaPercentage: z.number().min(0).max(100).optional().nullable(),
  backlogs: z.number().int().min(0).optional(),
  activeBacklogs: z.number().int().min(0).optional(),
  bio: z.string().max(1000).optional().nullable(),
  verificationStatus: z.nativeEnum(AcademicVerificationStatus).optional(),
  verificationNotes: z.string().max(500).optional().nullable(),
});

export const academicVerificationSchema = z.object({
  status: z.nativeEnum(AcademicVerificationStatus),
  notes: z.string().max(500).optional().nullable(),
});

// Skill Schemas
export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(500).optional().nullable(),
});

export const addStudentSkillSchema = z.object({
  skillId: z.string().uuid('Invalid skill ID'),
  proficiency: z.nativeEnum(SkillProficiency).default(SkillProficiency.INTERMEDIATE),
  yearsOfExperience: z.number().min(0).max(50).default(0),
});

export const updateStudentSkillSchema = z.object({
  proficiency: z.nativeEnum(SkillProficiency).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
});

// Project Schemas
export const baseProjectSchema = z.object({
  title: z.string().min(2, 'Project title is required').max(150),
  description: z.string().min(5, 'Description must be at least 5 characters').max(3000),
  technologies: z.array(z.string()).min(1, 'At least one technology required'),
  role: z.string().max(100).optional().nullable(),
  projectUrl: z.string().url('Invalid project URL').optional().nullable().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable().or(z.literal('')),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
});

export const projectSchema = baseProjectSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['endDate'],
});

export const updateProjectSchema = baseProjectSchema.partial();

// Internship Schemas
export const baseInternshipSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(150),
  role: z.string().min(2, 'Role is required').max(100),
  description: z.string().min(5, 'Description is required').max(3000),
  location: z.string().max(100).optional().nullable(),
  startDate: z.string().datetime('Valid start date is required'),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
  technologies: z.array(z.string()).default([]),
  documentUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const internshipSchema = baseInternshipSchema.refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['endDate'],
});

export const updateInternshipSchema = baseInternshipSchema.partial();

// Certification Schemas
export const baseCertificationSchema = z.object({
  name: z.string().min(2, 'Certification name is required').max(150),
  issuer: z.string().min(2, 'Issuer is required').max(150),
  issueDate: z.string().datetime('Valid issue date is required'),
  expiryDate: z.string().datetime().optional().nullable(),
  credentialId: z.string().max(100).optional().nullable(),
  credentialUrl: z.string().url('Invalid credential URL').optional().nullable().or(z.literal('')),
  documentUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const certificationSchema = baseCertificationSchema.refine((data) => {
  if (data.expiryDate && data.issueDate) {
    return new Date(data.expiryDate) >= new Date(data.issueDate);
  }
  return true;
}, {
  message: 'Expiry date must be greater than or equal to issue date',
  path: ['expiryDate'],
});

export const updateCertificationSchema = baseCertificationSchema.partial();

// Career Preference Schemas
export const careerPreferenceSchema = z.object({
  preferredRoles: z.array(z.string()).min(1, 'Select at least one preferred role'),
  preferredLocations: z.array(z.string()).default([]),
  remotePreference: z.boolean().default(false),
  minimumSalary: z.number().min(0).optional().nullable(),
  preferredSalary: z.number().min(0).optional().nullable(),
  currency: z.string().min(1).max(10).default('INR'),
  workPreference: z.nativeEnum(WorkPreference).default(WorkPreference.ANY),
}).refine((data) => {
  if (data.minimumSalary != null && data.preferredSalary != null) {
    return data.preferredSalary >= data.minimumSalary;
  }
  return true;
}, {
  message: 'Preferred salary must be greater than or equal to minimum salary',
  path: ['preferredSalary'],
});

// Admin Filter Query Schema
export const adminStudentQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  degreeId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  graduationYear: z.coerce.number().int().optional(),
  verificationStatus: z.nativeEnum(AcademicVerificationStatus).optional(),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  maxBacklogs: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['cgpa', 'graduationYear', 'createdAt', 'studentId']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
