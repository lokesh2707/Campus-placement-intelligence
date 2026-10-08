import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../src/services/api-client';

describe('Web ApiClient — Phase 4 Company & Recruiter API Methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches companies with query filters', async () => {
    const mockCompanies = [{ id: 'comp-1', name: 'TechNova', status: 'ACTIVE' }];
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockCompanies,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
    } as any);

    const res = await apiClient.getCompanies({ status: 'ACTIVE' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockCompanies);
  });

  it('creates an authorized recruiter invitation', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: { id: 'inv-1', email: 'test@comp.com' },
      }),
    } as any);

    const res = await apiClient.inviteRecruiter('comp-1', {
      email: 'test@comp.com',
      designation: 'HR Lead',
    });
    expect(res.success).toBe(true);
    expect(res.data?.email).toBe('test@comp.com');
  });

  it('updates company hiring preferences', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { companyId: 'comp-1', minimumCgpa: 8.0 },
      }),
    } as any);

    const res = await apiClient.updateCompanyPreferences('comp-1', { minimumCgpa: 8.0 });
    expect(res.success).toBe(true);
    expect(res.data?.minimumCgpa).toBe(8.0);
  });

  it('verifies a company with administrative remarks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 'comp-1', verificationStatus: 'VERIFIED' },
      }),
    } as any);

    const res = await apiClient.verifyCompany('comp-1', 'Approved');
    expect(res.success).toBe(true);
    expect(res.data?.verificationStatus).toBe('VERIFIED');
  });
});
