import { z } from 'zod';

export const createCollegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters').max(200),
  code: z.string().min(2, 'Code must be at least 2 characters').max(50).toUpperCase(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateCollegeSchema = createCollegeSchema.partial();

export const createCampusSchema = z.object({
  name: z.string().min(2, 'Campus name must be at least 2 characters').max(200),
  code: z.string().min(2).max(50).toUpperCase(),
  location: z.string().max(200).optional().nullable(),
  collegeId: z.string().uuid('Invalid college ID'),
});

export const updateCampusSchema = createCampusSchema.partial();

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(200),
  code: z.string().min(2).max(50).toUpperCase(),
  collegeId: z.string().uuid('Invalid college ID'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createDegreeSchema = z.object({
  name: z.string().min(2, 'Degree name must be at least 2 characters').max(200),
  code: z.string().min(2).max(50).toUpperCase(),
  departmentId: z.string().uuid('Invalid department ID'),
});

export const updateDegreeSchema = createDegreeSchema.partial();

export const createBatchSchema = z.object({
  name: z.string().min(2).max(50),
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  degreeId: z.string().uuid('Invalid degree ID'),
}).refine((data) => data.endYear >= data.startYear, {
  message: 'End year must be greater than or equal to start year',
  path: ['endYear'],
});

export const updateBatchSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  startYear: z.number().int().min(2000).max(2100).optional(),
  endYear: z.number().int().min(2000).max(2100).optional(),
  degreeId: z.string().uuid('Invalid degree ID').optional(),
});
