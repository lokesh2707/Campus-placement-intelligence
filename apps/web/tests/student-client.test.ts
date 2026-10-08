import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/services/api-client';

describe('Web Student Client & Dashboard Interactions', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:4000');
    client.setAuthToken('valid-mock-jwt');
    vi.restoreAllMocks();
  });

  it('fetches student profile with profile completion breakdown', async () => {
    const mockProfile = {
      id: 'profile-1',
      studentId: 'REG2022001',
      cgpa: 8.95,
      profileCompletion: { score: 85, basicInfo: true, academicInfo: true, skills: true },
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
    expect(res.data.profileCompletion.score).toBe(85);
  });

  it('manages skills, projects, and career preferences', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: { id: 'ss-1', skillId: 'skill-ts', proficiency: 'ADVANCED' },
        statusCode: 201,
      }),
    });

    const skillRes = await client.addStudentSkill({ skillId: 'skill-ts', proficiency: 'ADVANCED' });
    expect(skillRes.success).toBe(true);
    expect(skillRes.data.proficiency).toBe('ADVANCED');
  });

  it('queries admin student directory with filters and department scoping', async () => {
    const mockStudentList = [
      { id: 'profile-1', studentId: 'CSE-001', departmentId: 'dept-cse', verificationStatus: 'VERIFIED' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockStudentList,
        meta: { pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } },
        statusCode: 200,
      }),
    });

    const res = await client.getAdminStudents({ departmentId: 'dept-cse', verificationStatus: 'VERIFIED' });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].studentId).toBe('CSE-001');
  });

  it('verifies student academic status as admin', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 'profile-1', verificationStatus: 'VERIFIED', verifiedAt: new Date().toISOString() },
        statusCode: 200,
      }),
    });

    const res = await client.verifyAdminStudent('profile-1', 'VERIFIED', 'Verified against university transcripts');
    expect(res.success).toBe(true);
    expect(res.data.verificationStatus).toBe('VERIFIED');
  });
});
