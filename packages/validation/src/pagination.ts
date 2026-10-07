import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@campus-os/config';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid identifier format' }),
});

export type UuidParamInput = z.infer<typeof uuidParamSchema>;
