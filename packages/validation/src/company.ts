import { z } from 'zod';

export const companyTypeEnum = z.enum([
  'STARTUP',
  'SMALL_BUSINESS',
  'MEDIUM_BUSINESS',
  'ENTERPRISE',
  'MNC',
  'GOVERNMENT',
  'NGO',
  'OTHER',
]);

export const companySizeEnum = z.enum([
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'ENTERPRISE',
]);

export const companyStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'ARCHIVED',
]);

export const companyVerificationStatusEnum = z.enum([
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
]);

export const recruiterStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const recruiterVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
]);

export const companyContactTypeEnum = z.enum([
  'HR',
  'RECRUITMENT',
  'TECHNICAL',
  'FINANCE',
  'LEGAL',
  'OTHER',
]);

export const companyDocumentTypeEnum = z.enum([
  'REGISTRATION_CERTIFICATE',
  'COMPANY_PAN',
  'GST_CERTIFICATE',
  'AUTHORIZATION_LETTER',
  'OTHER',
]);

export const documentVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
]);

export const workPreferenceEnum = z.enum([
  'ONSITE',
  'HYBRID',
  'REMOTE',
  'ANY',
]);

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(120),
  legalName: z.string().max(150).optional().nullable(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens')
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  industry: z.string().min(2, 'Industry is required').max(100),
  companyType: companyTypeEnum.default('ENTERPRISE'),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
  headquarters: z.string().max(150).optional().nullable(),
  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  companySize: companySizeEnum.default('MEDIUM'),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  contactEmail: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  contactPhone: z.string().max(25).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const verifyCompanySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'UNDER_REVIEW']),
  notes: z.string().max(1000).optional(),
});

export const companyContactSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters').max(100),
  designation: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(25).optional().nullable(),
  contactType: companyContactTypeEnum.default('HR'),
  isPrimary: z.boolean().default(false),
});

export const updateCompanyContactSchema = companyContactSchema.partial();

export const companyHiringPreferenceSchema = z.object({
  preferredDepartments: z.array(z.string()).default([]),
  preferredDegrees: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  preferredWorkModes: z.array(workPreferenceEnum).default([]),
  minimumCgpa: z.number().min(0).max(10).optional().nullable(),
  maximumBacklogs: z.number().int().min(0).max(50).optional().nullable(),
  preferredGraduationYears: z.array(z.number().int().min(2000).max(2100)).default([]),
});

export const updateCompanyHiringPreferenceSchema = companyHiringPreferenceSchema.partial();

export const inviteRecruiterSchema = z.object({
  email: z.string().email('Invalid work email address'),
  designation: z.string().max(100).optional().nullable(),
  role: z.enum(['RECRUITER']).default('RECRUITER'),
});

export const acceptRecruiterInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
});

export const updateRecruiterProfileSchema = z.object({
  designation: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  employeeId: z.string().max(50).optional().nullable(),
  workEmail: z.string().email().optional().nullable().or(z.literal('')),
  workPhone: z.string().max(25).optional().nullable(),
  profilePhoto: z.string().url().optional().nullable().or(z.literal('')),
});

export const verifyRecruiterSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
  notes: z.string().max(1000).optional(),
});

export const verifyCompanyDocumentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
  notes: z.string().max(1000).optional(),
});
