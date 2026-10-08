import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mobileApi } from '../src/services/api-client';

describe('Mobile ApiClient — Phase 4 Recruiter Hub Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves recruiter profile and corporate identity', async () => {
    const mockRecruiter = {
      profile: { id: 'rec-1', designation: 'Talent Acquisition' },
      company: { id: 'comp-1', name: 'TechNova Solutions', verificationStatus: 'VERIFIED' },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockRecruiter,
      }),
    } as any);

    const res = await mobileApi.getRecruiterMe();
    expect(res.success).toBe(true);
    expect(res.data?.company.name).toBe('TechNova Solutions');
    expect(res.data?.profile.designation).toBe('Talent Acquisition');
  });

  it('fetches company compliance documents list', async () => {
    const mockDocs = [{ id: 'doc-1', fileName: 'Incorporation.pdf', verificationStatus: 'VERIFIED' }];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockDocs,
      }),
    } as any);

    const res = await mobileApi.getCompanyDocuments('comp-1');
    expect(res.success).toBe(true);
    expect(res.data?.length).toBe(1);
    expect(res.data?.[0].fileName).toBe('Incorporation.pdf');
  });

  it('fetches hiring preferences criteria', async () => {
    const mockPrefs = { companyId: 'comp-1', minimumCgpa: 7.5, maximumBacklogs: 0 };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockPrefs,
      }),
    } as any);

    const res = await mobileApi.getCompanyPreferences('comp-1');
    expect(res.success).toBe(true);
    expect(res.data?.minimumCgpa).toBe(7.5);
  });
});
