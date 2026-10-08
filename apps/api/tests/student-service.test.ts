import { describe, it, expect, beforeEach } from 'vitest';
import { StudentService } from '../src/services/student.service.js';
import {
  AcademicVerificationStatus,
  SkillProficiency,
  UserRole,
  TokenPayload,
} from '@campus-os/shared-types';
import { ApiError } from '../src/errors/api-error.js';
import { Readable } from 'node:stream';

describe('Phase 3 — Student & Academic Management Service', () => {
  let studentService: StudentService;

  // In-memory mock databases
  let mockColleges: any[];
  let mockDepartments: any[];
  let mockDegrees: any[];
  let mockBatches: any[];
  let mockStudentProfiles: any[];
  let mockSkills: any[];
  let mockStudentSkills: any[];
  let mockProjects: any[];
  let mockInternships: any[];
  let mockCertifications: any[];
  let mockCareerPreferences: any[];
  let mockResumes: any[];
  let mockAuditLogs: any[];

  beforeEach(() => {
    mockColleges = [
      { id: 'college-1', name: 'Apex Institute of Technology', code: 'AIT' },
    ];
    mockDepartments = [
      { id: 'dept-cse', name: 'Computer Science', code: 'CSE', collegeId: 'college-1' },
      { id: 'dept-ece', name: 'Electronics', code: 'ECE', collegeId: 'college-1' },
    ];
    mockDegrees = [
      { id: 'degree-cse', name: 'B.Tech CSE', code: 'BTCSE', departmentId: 'dept-cse' },
      { id: 'degree-ece', name: 'B.Tech ECE', code: 'BTECE', departmentId: 'dept-ece' },
    ];
    mockBatches = [
      { id: 'batch-2026', name: 'Batch 2026', startYear: 2022, endYear: 2026, degreeId: 'degree-cse' },
      { id: 'batch-ece-2026', name: 'Batch 2026', startYear: 2022, endYear: 2026, degreeId: 'degree-ece' },
    ];
    mockStudentProfiles = [];
    mockSkills = [
      { id: 'skill-ts', name: 'TypeScript', category: 'Programming Language', status: 'ACTIVE' },
      { id: 'skill-react', name: 'React', category: 'Framework', status: 'ACTIVE' },
      { id: 'skill-node', name: 'Node.js', category: 'Framework', status: 'ACTIVE' },
      { id: 'skill-pg', name: 'PostgreSQL', category: 'Database', status: 'ACTIVE' },
    ];
    mockStudentSkills = [];
    mockProjects = [];
    mockInternships = [];
    mockCertifications = [];
    mockCareerPreferences = [];
    mockResumes = [];
    mockAuditLogs = [];

    const fakeAcademicRepo: any = {
      findCollegeById: async (id: string) => mockColleges.find((c) => c.id === id) || null,
      findDepartmentById: async (id: string) => mockDepartments.find((d) => d.id === id) || null,
      findDegreeById: async (id: string) => mockDegrees.find((d) => d.id === id) || null,
      findBatchById: async (id: string) => mockBatches.find((b) => b.id === id) || null,
    };

    const fakeStudentRepo: any = {
      findByUserId: async (userId: string) => {
        const p = mockStudentProfiles.find((sp) => sp.userId === userId);
        if (!p) return null;
        return {
          ...p,
          skills: mockStudentSkills.filter((s) => s.studentProfileId === p.id),
          projects: mockProjects.filter((prj) => prj.studentProfileId === p.id),
          internships: mockInternships.filter((intn) => intn.studentProfileId === p.id),
          certifications: mockCertifications.filter((cert) => cert.studentProfileId === p.id),
          careerPreference: mockCareerPreferences.find((cp) => cp.studentProfileId === p.id) || null,
          resumes: mockResumes.filter((r) => r.studentProfileId === p.id),
        };
      },
      findById: async (id: string) => {
        const p = mockStudentProfiles.find((sp) => sp.id === id);
        if (!p) return null;
        return {
          ...p,
          skills: mockStudentSkills.filter((s) => s.studentProfileId === p.id),
          projects: mockProjects.filter((prj) => prj.studentProfileId === p.id),
          internships: mockInternships.filter((intn) => intn.studentProfileId === p.id),
          certifications: mockCertifications.filter((cert) => cert.studentProfileId === p.id),
          careerPreference: mockCareerPreferences.find((cp) => cp.studentProfileId === p.id) || null,
          resumes: mockResumes.filter((r) => r.studentProfileId === p.id),
        };
      },
      findByStudentId: async (studentId: string) => {
        return mockStudentProfiles.find((sp) => sp.studentId === studentId) || null;
      },
      createProfile: async (data: any) => {
        const newProfile = {
          id: `profile-${mockStudentProfiles.length + 1}`,
          ...data,
          verificationStatus: AcademicVerificationStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockStudentProfiles.push(newProfile);
        return {
          ...newProfile,
          skills: [],
          projects: [],
          internships: [],
          certifications: [],
          careerPreference: null,
          resumes: [],
        };
      },
      updateProfile: async (id: string, data: any) => {
        const p = mockStudentProfiles.find((sp) => sp.id === id);
        if (!p) throw new Error('Not found');
        Object.assign(p, data, { updatedAt: new Date() });
        return {
          ...p,
          skills: mockStudentSkills.filter((s) => s.studentProfileId === p.id),
          projects: mockProjects.filter((prj) => prj.studentProfileId === p.id),
          internships: mockInternships.filter((intn) => intn.studentProfileId === p.id),
          certifications: mockCertifications.filter((cert) => cert.studentProfileId === p.id),
          careerPreference: mockCareerPreferences.find((cp) => cp.studentProfileId === p.id) || null,
          resumes: mockResumes.filter((r) => r.studentProfileId === p.id),
        };
      },
      findMany: async (params: any) => {
        let list = [...mockStudentProfiles];
        if (params.departmentId) list = list.filter((p) => p.departmentId === params.departmentId);
        if (params.verificationStatus) list = list.filter((p) => p.verificationStatus === params.verificationStatus);
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((p) => p.studentId.toLowerCase().includes(q));
        }
        return {
          students: list.map((p) => ({
            ...p,
            skills: mockStudentSkills.filter((s) => s.studentProfileId === p.id),
            projects: mockProjects.filter((prj) => prj.studentProfileId === p.id),
            internships: mockInternships.filter((intn) => intn.studentProfileId === p.id),
            certifications: mockCertifications.filter((cert) => cert.studentProfileId === p.id),
            careerPreference: mockCareerPreferences.find((cp) => cp.studentProfileId === p.id) || null,
            resumes: mockResumes.filter((r) => r.studentProfileId === p.id),
          })),
          total: list.length,
        };
      },
      findSkillById: async (id: string) => mockSkills.find((s) => s.id === id) || null,
      findStudentSkill: async (studentProfileId: string, skillId: string) =>
        mockStudentSkills.find((s) => s.studentProfileId === studentProfileId && s.skillId === skillId) || null,
      addStudentSkill: async (studentProfileId: string, skillId: string, proficiency: any, yearsOfExperience: number) => {
        const item = {
          id: `ss-${mockStudentSkills.length + 1}`,
          studentProfileId,
          skillId,
          proficiency,
          yearsOfExperience,
          skill: mockSkills.find((s) => s.id === skillId),
        };
        mockStudentSkills.push(item);
        return item;
      },
      updateStudentSkill: async (studentProfileId: string, skillId: string, data: any) => {
        const item = mockStudentSkills.find((s) => s.studentProfileId === studentProfileId && s.skillId === skillId);
        if (!item) throw new Error('Not found');
        Object.assign(item, data);
        return item;
      },
      removeStudentSkill: async (studentProfileId: string, skillId: string) => {
        mockStudentSkills = mockStudentSkills.filter(
          (s) => !(s.studentProfileId === studentProfileId && s.skillId === skillId)
        );
      },
      getProjects: async (studentProfileId: string) =>
        mockProjects.filter((p) => p.studentProfileId === studentProfileId),
      findProjectById: async (id: string) => mockProjects.find((p) => p.id === id) || null,
      addProject: async (studentProfileId: string, data: any) => {
        const item = { id: `prj-${mockProjects.length + 1}`, studentProfileId, ...data };
        mockProjects.push(item);
        return item;
      },
      updateProject: async (id: string, _studentProfileId: string, data: any) => {
        const item = mockProjects.find((p) => p.id === id);
        if (!item) throw new Error('Not found');
        Object.assign(item, data);
        return item;
      },
      deleteProject: async (id: string) => {
        mockProjects = mockProjects.filter((p) => p.id !== id);
      },
      getResumes: async (studentProfileId: string) =>
        mockResumes.filter((r) => r.studentProfileId === studentProfileId),
      findResumeById: async (id: string) => mockResumes.find((r) => r.id === id) || null,
      createResume: async (data: any) => {
        if (data.isActive) {
          mockResumes.forEach((r) => {
            if (r.studentProfileId === data.studentProfileId) r.isActive = false;
          });
        }
        const item = { id: `res-${mockResumes.length + 1}`, ...data, uploadedAt: new Date() };
        mockResumes.push(item);
        return item;
      },
      setActiveResume: async (studentProfileId: string, resumeId: string) => {
        mockResumes.forEach((r) => {
          if (r.studentProfileId === studentProfileId) r.isActive = r.id === resumeId;
        });
        return mockResumes.find((r) => r.id === resumeId);
      },
      deleteResume: async (id: string) => {
        mockResumes = mockResumes.filter((r) => r.id !== id);
      },
    };

    const fakeAudit: any = {
      log: async (event: any) => {
        mockAuditLogs.push(event);
      },
    };

    const fakeStorage: any = {
      upload: async (buf: Buffer, filename: string, mime: string) => ({
        fileKey: `resumes/mock-${filename}`,
        originalFilename: filename,
        mimeType: mime,
        sizeBytes: buf.length,
        url: `/api/v1/storage/files/mock-${filename}`,
      }),
      delete: async () => {},
      getStream: async () => Readable.from(['mock file content']),
    };

    studentService = new StudentService(fakeStudentRepo, fakeAcademicRepo, fakeAudit, fakeStorage);
  });

  describe('Student Profile Lifecycle & Separation', () => {
    it('creates a student profile and verifies academic foreign keys', async () => {
      const profile = await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
        phone: '+919999999991',
        cgpa: 8.5,
        tenthPercentage: 90,
        twelfthPercentage: 88,
      });

      expect(profile).toBeDefined();
      expect(profile.studentId).toBe('REG2022001');
      expect(profile.verificationStatus).toBe(AcademicVerificationStatus.PENDING);
      expect(mockAuditLogs).toHaveLength(1);
      expect(mockAuditLogs[0].event).toBe('STUDENT_CREATED');
    });

    it('rejects duplicate registration numbers', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      await expect(
        studentService.createProfile('user-student-2', {
          studentId: 'REG2022001',
          collegeId: 'college-1',
          departmentId: 'dept-cse',
          degreeId: 'degree-cse',
          batchId: 'batch-2026',
          graduationYear: 2026,
        })
      ).rejects.toThrow(ApiError);
    });

    it('restricts student self-update to personal fields only and ignores institution fields', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
        cgpa: 8.0,
      });

      // Student attempts to modify their own bio AND maliciously change their CGPA
      const updated = await studentService.updateMyProfile('user-student-1', {
        bio: 'Updated student bio',
        cgpa: 9.99, // Should NOT be applied
        studentId: 'HACKED-REG', // Should NOT be applied
      });

      expect(updated.bio).toBe('Updated student bio');
      expect(updated.cgpa).toBe(8.0);
      expect(updated.studentId).toBe('REG2022001');
    });
  });

  describe('Deterministic Profile Completion', () => {
    it('computes completion score deterministically based on section fulfillment', async () => {
      const emptyProfile: any = { skills: [], projects: [], internships: [], certifications: [], resumes: [] };
      const scoreEmpty = studentService.calculateProfileCompletion(emptyProfile);
      expect(scoreEmpty.score).toBe(0);

      // Basic info fulfilled (phone + bio) => 15%
      const basicProfile: any = {
        phone: '+919999999999',
        bio: 'Hello world',
        skills: [],
        projects: [],
        internships: [],
        certifications: [],
        resumes: [],
      };
      const scoreBasic = studentService.calculateProfileCompletion(basicProfile);
      expect(scoreBasic.score).toBe(15);
      expect(scoreBasic.basicInfo).toBe(true);

      // Add academic metrics (CGPA, 10th, 12th) => +20% = 35%
      const academicProfile: any = {
        ...basicProfile,
        cgpa: 8.5,
        tenthPercentage: 90,
        twelfthPercentage: 88,
      };
      const scoreAcademic = studentService.calculateProfileCompletion(academicProfile);
      expect(scoreAcademic.score).toBe(35);
      expect(scoreAcademic.academicInfo).toBe(true);

      // Add 3 skills => +20% = 55%
      const skillsProfile: any = {
        ...academicProfile,
        skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
      };
      const scoreSkills = studentService.calculateProfileCompletion(skillsProfile);
      expect(scoreSkills.score).toBe(55);

      // Add 1 project => +15% = 70%
      const projectsProfile: any = {
        ...skillsProfile,
        projects: [{ id: 'p1' }],
      };
      const scoreProjects = studentService.calculateProfileCompletion(projectsProfile);
      expect(scoreProjects.score).toBe(70);

      // Add 1 internship => +10% = 80%
      const intnProfile: any = {
        ...projectsProfile,
        internships: [{ id: 'i1' }],
      };
      const scoreIntn = studentService.calculateProfileCompletion(intnProfile);
      expect(scoreIntn.score).toBe(80);

      // Add 1 certification => +5% = 85%
      const certProfile: any = {
        ...intnProfile,
        certifications: [{ id: 'c1' }],
      };
      const scoreCert = studentService.calculateProfileCompletion(certProfile);
      expect(scoreCert.score).toBe(85);

      // Add active resume => +15% = 100%
      const fullProfile: any = {
        ...certProfile,
        resumes: [{ id: 'r1', isActive: true }],
      };
      const scoreFull = studentService.calculateProfileCompletion(fullProfile);
      expect(scoreFull.score).toBe(100);
    });
  });

  describe('Skills Management & Duplicate Prevention', () => {
    it('adds skill and prevents duplicate skill additions', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const added = await studentService.addStudentSkill(
        'user-student-1',
        'skill-ts',
        SkillProficiency.ADVANCED,
        2
      );
      expect(added.skillId).toBe('skill-ts');

      // Attempting to add the same skill again must throw 409
      await expect(
        studentService.addStudentSkill('user-student-1', 'skill-ts', SkillProficiency.EXPERT)
      ).rejects.toThrow(ApiError);
    });

    it('updates proficiency and removes skills', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      await studentService.addStudentSkill('user-student-1', 'skill-react');
      const updated = await studentService.updateStudentSkill('user-student-1', 'skill-react', {
        proficiency: SkillProficiency.EXPERT,
      });
      expect(updated.proficiency).toBe(SkillProficiency.EXPERT);

      await studentService.removeStudentSkill('user-student-1', 'skill-react');
      const profile = await studentService.getMyProfile('user-student-1');
      expect(profile.skills).toHaveLength(0);
    });
  });

  describe('Projects CRUD and Student Ownership', () => {
    it('creates and updates student project', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const prj = await studentService.addProject('user-student-1', {
        title: 'Placement AI Engine',
        description: 'Predictive placement readiness platform',
        technologies: ['TypeScript', 'FastAPI'],
      });
      expect(prj.title).toBe('Placement AI Engine');

      const updated = await studentService.updateProject('user-student-1', prj.id, {
        title: 'Placement AI Engine v2',
      });
      expect(updated.title).toBe('Placement AI Engine v2');
    });

    it('prevents another student from modifying foreign project', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      await studentService.createProfile('user-student-2', {
        studentId: 'REG2022002',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const prj = await studentService.addProject('user-student-1', {
        title: 'Student 1 Project',
        description: 'Owned by student 1',
        technologies: ['Node.js'],
      });

      await expect(
        studentService.updateProject('user-student-2', prj.id, { title: 'Hijacked' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('Resume Management & File Validation', () => {
    it('uploads valid PDF resume and auto-activates the first version', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const pdfBuffer = Buffer.from('%PDF-1.4 mock content');
      const resume = await studentService.uploadResume(
        'user-student-1',
        pdfBuffer,
        'my_resume.pdf',
        'application/pdf'
      );

      expect(resume.version).toBe(1);
      expect(resume.isActive).toBe(true);
      expect(mockAuditLogs.some((l) => l.event === 'RESUME_UPLOADED')).toBe(true);
    });

    it('rejects forbidden file types (e.g. executables)', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const exeBuffer = Buffer.from('MZ binary executable content');
      await expect(
        studentService.uploadResume('user-student-1', exeBuffer, 'malware.exe', 'application/x-msdownload')
      ).rejects.toThrow(ApiError);
    });

    it('rejects files exceeding 5 MB limit', async () => {
      await studentService.createProfile('user-student-1', {
        studentId: 'REG2022001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
      });

      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
      await expect(
        studentService.uploadResume('user-student-1', largeBuffer, 'huge_file.pdf', 'application/pdf')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('Object-Level Authorization & Department Scoping', () => {
    let profileCSE: any;
    let profileECE: any;

    beforeEach(async () => {
      profileCSE = await studentService.createProfile('user-cse', {
        studentId: 'CSE-001',
        collegeId: 'college-1',
        departmentId: 'dept-cse',
        degreeId: 'degree-cse',
        batchId: 'batch-2026',
        graduationYear: 2026,
        cgpa: 9.0,
      });

      profileECE = await studentService.createProfile('user-ece', {
        studentId: 'ECE-001',
        collegeId: 'college-1',
        departmentId: 'dept-ece',
        degreeId: 'degree-ece',
        batchId: 'batch-ece-2026',
        graduationYear: 2026,
        cgpa: 8.5,
      });
    });

    it('department coordinator for CSE only sees CSE students', async () => {
      const cseCoordToken: TokenPayload = {
        userId: 'coord-cse-user',
        email: 'deptcoord-cse@campus.edu',
        role: UserRole.DEPARTMENT_COORDINATOR,
        departmentId: 'dept-cse',
        sessionId: 'sess-1',
      };

      const result = await studentService.listStudentsForAdmin(cseCoordToken, {});
      expect(result.data).toHaveLength(1);
      expect(result.data[0].studentId).toBe('CSE-001');
    });

    it('department coordinator cannot view or verify student of another department', async () => {
      const cseCoordToken: TokenPayload = {
        userId: 'coord-cse-user',
        email: 'deptcoord-cse@campus.edu',
        role: UserRole.DEPARTMENT_COORDINATOR,
        departmentId: 'dept-cse',
        sessionId: 'sess-1',
      };

      // CSE Coordinator attempting to access ECE student profile must be rejected
      await expect(
        studentService.getStudentByIdForAdmin(cseCoordToken, profileECE.id)
      ).rejects.toThrow(ApiError);

      // CSE Coordinator attempting to verify ECE student profile must be rejected
      await expect(
        studentService.verifyAcademicInfo(cseCoordToken, profileECE.id, AcademicVerificationStatus.VERIFIED)
      ).rejects.toThrow(ApiError);
    });

    it('placement admin can access and verify students across all departments', async () => {
      const adminToken: TokenPayload = {
        userId: 'admin-user',
        email: 'placementadmin@campus.edu',
        role: UserRole.PLACEMENT_ADMIN,
        sessionId: 'sess-admin',
      };

      const result = await studentService.listStudentsForAdmin(adminToken, {});
      expect(result.data).toHaveLength(2);

      const verified = await studentService.verifyAcademicInfo(
        adminToken,
        profileECE.id,
        AcademicVerificationStatus.VERIFIED,
        'Marks verified against university records'
      );

      expect(verified.verificationStatus).toBe(AcademicVerificationStatus.VERIFIED);
      expect(mockAuditLogs.some((l) => l.event === 'ACADEMIC_INFO_VERIFIED')).toBe(true);
    });
  });
});
