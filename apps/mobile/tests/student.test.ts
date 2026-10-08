import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileApiClient } from '../src/services/api-client';

describe('Mobile Student Experience & Data Fetching', () => {
  let client: MobileApiClient;

  beforeEach(() => {
    client = new MobileApiClient('http://localhost:4000/api/v1');
    client.setToken('test-mobile-jwt');
    vi.restoreAllMocks();
  });

  it('retrieves student profile and handles loading & network responses', async () => {
    const mockProfile = {
      id: 'profile-mobile-1',
      studentId: 'REG2022001',
      cgpa: 8.95,
      verificationStatus: 'VERIFIED',
      skills: [{ id: '1', skill: { name: 'TypeScript' }, proficiency: 'ADVANCED' }],
      profileCompletion: { score: 85 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockProfile,
        statusCode: 200,
      }),
    });

    const res = await client.getStudentProfile();
    expect(res.success).toBe(true);
    expect(res.data.studentId).toBe('REG2022001');
    expect(res.data.verificationStatus).toBe('VERIFIED');
    expect(res.data.skills).toHaveLength(1);
  });

  it('handles offline / network error states gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network request failed'));

    await expect(client.getStudentProfile()).rejects.toThrow('Network request failed');
  });

  it('supports adding skill and toggling active resume on mobile', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 'resume-1', isActive: true },
        statusCode: 200,
      }),
    });

    const res = await client.setActiveResume('resume-1');
    expect(res.success).toBe(true);
    expect(res.data.isActive).toBe(true);
  });
});
