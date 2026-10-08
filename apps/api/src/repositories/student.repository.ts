import {
  PrismaClient,
  StudentProfile,
  Skill,
  StudentSkill,
  StudentProject,
  StudentInternship,
  StudentCertification,
  StudentCareerPreference,
  Resume,
  AcademicVerificationStatus,
  SkillProficiency,
  WorkPreference,
  RecordStatus,
} from '@prisma/client';
import { prisma } from './health.repository.js';

export interface StudentFilterParams {
  search?: string;
  departmentId?: string;
  degreeId?: string;
  batchId?: string;
  collegeId?: string;
  graduationYear?: number;
  verificationStatus?: AcademicVerificationStatus;
  minCgpa?: number;
  maxBacklogs?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class StudentRepository {
  constructor(private db: PrismaClient = prisma) {}

  private profileIncludeClause = {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    },
    college: true,
    department: true,
    degree: true,
    batch: true,
    skills: {
      include: {
        skill: true,
      },
    },
    projects: {
      orderBy: { createdAt: 'desc' as const },
    },
    internships: {
      orderBy: { startDate: 'desc' as const },
    },
    certifications: {
      orderBy: { issueDate: 'desc' as const },
    },
    careerPreference: true,
    resumes: {
      orderBy: { version: 'desc' as const },
    },
  };

  async findByUserId(userId: string): Promise<any | null> {
    return this.db.studentProfile.findUnique({
      where: { userId },
      include: this.profileIncludeClause,
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.db.studentProfile.findUnique({
      where: { id },
      include: this.profileIncludeClause,
    });
  }

  async findByStudentId(studentId: string): Promise<any | null> {
    return this.db.studentProfile.findUnique({
      where: { studentId },
      include: this.profileIncludeClause,
    });
  }

  async createProfile(data: {
    userId: string;
    studentId: string;
    collegeId: string;
    departmentId: string;
    degreeId: string;
    batchId: string;
    graduationYear: number;
    dateOfBirth?: Date | null;
    gender?: string | null;
    phone?: string | null;
    cgpa?: number | null;
    tenthPercentage?: number | null;
    twelfthPercentage?: number | null;
    diplomaPercentage?: number | null;
    backlogs?: number;
    activeBacklogs?: number;
    bio?: string | null;
    profilePhoto?: string | null;
  }): Promise<any> {
    return this.db.studentProfile.create({
      data: {
        userId: data.userId,
        studentId: data.studentId.trim(),
        collegeId: data.collegeId,
        departmentId: data.departmentId,
        degreeId: data.degreeId,
        batchId: data.batchId,
        graduationYear: data.graduationYear,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        phone: data.phone || null,
        cgpa: data.cgpa ?? null,
        tenthPercentage: data.tenthPercentage ?? null,
        twelfthPercentage: data.twelfthPercentage ?? null,
        diplomaPercentage: data.diplomaPercentage ?? null,
        backlogs: data.backlogs ?? 0,
        activeBacklogs: data.activeBacklogs ?? 0,
        bio: data.bio || null,
        profilePhoto: data.profilePhoto || null,
      },
      include: this.profileIncludeClause,
    });
  }

  async updateProfile(id: string, data: Partial<StudentProfile>): Promise<any> {
    return this.db.studentProfile.update({
      where: { id },
      data,
      include: this.profileIncludeClause,
    });
  }

  async findMany(params: StudentFilterParams): Promise<{ students: any[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.collegeId) where.collegeId = params.collegeId;
    if (params.degreeId) where.degreeId = params.degreeId;
    if (params.batchId) where.batchId = params.batchId;
    if (params.graduationYear) where.graduationYear = params.graduationYear;
    if (params.verificationStatus) where.verificationStatus = params.verificationStatus;

    if (params.minCgpa !== undefined) {
      where.cgpa = { gte: params.minCgpa };
    }
    if (params.maxBacklogs !== undefined) {
      where.activeBacklogs = { lte: params.maxBacklogs };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { studentId: { contains: q, mode: 'insensitive' } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    if (sortField === 'name') {
      orderBy.user = { firstName: sortOrder };
    } else {
      orderBy[sortField] = sortOrder;
    }

    const [students, total] = await Promise.all([
      this.db.studentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.profileIncludeClause,
      }),
      this.db.studentProfile.count({ where }),
    ]);

    return { students, total };
  }

  // ====================
  // Skills Management
  // ====================

  async listTaxonomySkills(category?: string): Promise<Skill[]> {
    const where: any = { status: RecordStatus.ACTIVE };
    if (category) where.category = category;
    return this.db.skill.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findSkillById(id: string): Promise<Skill | null> {
    return this.db.skill.findUnique({ where: { id } });
  }

  async findSkillByName(name: string): Promise<Skill | null> {
    return this.db.skill.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
  }

  async createSkill(data: { name: string; category: string; description?: string | null }): Promise<Skill> {
    return this.db.skill.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        description: data.description?.trim() || null,
      },
    });
  }

  async addStudentSkill(
    studentProfileId: string,
    skillId: string,
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE,
    yearsOfExperience = 0
  ): Promise<StudentSkill> {
    return this.db.studentSkill.create({
      data: {
        studentProfileId,
        skillId,
        proficiency,
        yearsOfExperience,
      },
      include: { skill: true },
    });
  }

  async findStudentSkill(studentProfileId: string, skillId: string): Promise<StudentSkill | null> {
    return this.db.studentSkill.findUnique({
      where: {
        studentProfileId_skillId: {
          studentProfileId,
          skillId,
        },
      },
    });
  }

  async updateStudentSkill(
    studentProfileId: string,
    skillId: string,
    data: { proficiency?: SkillProficiency; yearsOfExperience?: number }
  ): Promise<StudentSkill> {
    return this.db.studentSkill.update({
      where: {
        studentProfileId_skillId: {
          studentProfileId,
          skillId,
        },
      },
      data,
      include: { skill: true },
    });
  }

  async removeStudentSkill(studentProfileId: string, skillId: string): Promise<void> {
    await this.db.studentSkill.delete({
      where: {
        studentProfileId_skillId: {
          studentProfileId,
          skillId,
        },
      },
    });
  }

  // ====================
  // Projects Management
  // ====================

  async getProjects(studentProfileId: string): Promise<StudentProject[]> {
    return this.db.studentProject.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProjectById(id: string): Promise<StudentProject | null> {
    return this.db.studentProject.findUnique({ where: { id } });
  }

  async addProject(studentProfileId: string, data: any): Promise<StudentProject> {
    return this.db.studentProject.create({
      data: {
        studentProfileId,
        title: data.title.trim(),
        description: data.description.trim(),
        technologies: data.technologies,
        role: data.role || null,
        projectUrl: data.projectUrl || null,
        githubUrl: data.githubUrl || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent ?? false,
      },
    });
  }

  async updateProject(id: string, studentProfileId: string, data: any): Promise<StudentProject> {
    return this.db.studentProject.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.db.studentProject.delete({ where: { id } });
  }

  // ====================
  // Internships Management
  // ====================

  async getInternships(studentProfileId: string): Promise<StudentInternship[]> {
    return this.db.studentInternship.findMany({
      where: { studentProfileId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findInternshipById(id: string): Promise<StudentInternship | null> {
    return this.db.studentInternship.findUnique({ where: { id } });
  }

  async addInternship(studentProfileId: string, data: any): Promise<StudentInternship> {
    return this.db.studentInternship.create({
      data: {
        studentProfileId,
        companyName: data.companyName.trim(),
        role: data.role.trim(),
        description: data.description.trim(),
        location: data.location || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent ?? false,
        technologies: data.technologies || [],
        documentUrl: data.documentUrl || null,
        verificationStatus: AcademicVerificationStatus.PENDING,
      },
    });
  }

  async updateInternship(id: string, data: any): Promise<StudentInternship> {
    return this.db.studentInternship.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteInternship(id: string): Promise<void> {
    await this.db.studentInternship.delete({ where: { id } });
  }

  // ====================
  // Certifications Management
  // ====================

  async getCertifications(studentProfileId: string): Promise<StudentCertification[]> {
    return this.db.studentCertification.findMany({
      where: { studentProfileId },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findCertificationById(id: string): Promise<StudentCertification | null> {
    return this.db.studentCertification.findUnique({ where: { id } });
  }

  async addCertification(studentProfileId: string, data: any): Promise<StudentCertification> {
    return this.db.studentCertification.create({
      data: {
        studentProfileId,
        name: data.name.trim(),
        issuer: data.issuer.trim(),
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        credentialId: data.credentialId || null,
        credentialUrl: data.credentialUrl || null,
        documentUrl: data.documentUrl || null,
      },
    });
  }

  async updateCertification(id: string, data: any): Promise<StudentCertification> {
    return this.db.studentCertification.update({
      where: { id },
      data: {
        ...data,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }

  async deleteCertification(id: string): Promise<void> {
    await this.db.studentCertification.delete({ where: { id } });
  }

  // ====================
  // Career Preferences Management
  // ====================

  async getCareerPreference(studentProfileId: string): Promise<StudentCareerPreference | null> {
    return this.db.studentCareerPreference.findUnique({
      where: { studentProfileId },
    });
  }

  async upsertCareerPreference(studentProfileId: string, data: any): Promise<StudentCareerPreference> {
    return this.db.studentCareerPreference.upsert({
      where: { studentProfileId },
      create: {
        studentProfileId,
        preferredRoles: data.preferredRoles,
        preferredLocations: data.preferredLocations || [],
        remotePreference: data.remotePreference ?? false,
        minimumSalary: data.minimumSalary ?? null,
        preferredSalary: data.preferredSalary ?? null,
        currency: data.currency || 'INR',
        workPreference: data.workPreference || WorkPreference.ANY,
      },
      update: {
        preferredRoles: data.preferredRoles,
        preferredLocations: data.preferredLocations || [],
        remotePreference: data.remotePreference ?? false,
        minimumSalary: data.minimumSalary ?? null,
        preferredSalary: data.preferredSalary ?? null,
        currency: data.currency || 'INR',
        workPreference: data.workPreference || WorkPreference.ANY,
      },
    });
  }

  // ====================
  // Resume Management
  // ====================

  async getResumes(studentProfileId: string): Promise<Resume[]> {
    return this.db.resume.findMany({
      where: { studentProfileId },
      orderBy: { version: 'desc' },
    });
  }

  async findResumeById(id: string): Promise<Resume | null> {
    return this.db.resume.findUnique({ where: { id } });
  }

  async createResume(data: {
    studentProfileId: string;
    fileKey: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: bigint | number;
    version: number;
    isActive?: boolean;
  }): Promise<Resume> {
    if (data.isActive) {
      // Deactivate all previous resumes for this student profile
      await this.db.resume.updateMany({
        where: { studentProfileId: data.studentProfileId },
        data: { isActive: false },
      });
    }

    return this.db.resume.create({
      data: {
        studentProfileId: data.studentProfileId,
        fileKey: data.fileKey,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        sizeBytes: BigInt(data.sizeBytes),
        version: data.version,
        isActive: data.isActive ?? false,
      },
    });
  }

  async setActiveResume(studentProfileId: string, resumeId: string): Promise<Resume> {
    await this.db.resume.updateMany({
      where: { studentProfileId },
      data: { isActive: false },
    });

    return this.db.resume.update({
      where: { id: resumeId },
      data: { isActive: true },
    });
  }

  async deleteResume(id: string): Promise<void> {
    await this.db.resume.delete({ where: { id } });
  }
}

export const studentRepository = new StudentRepository();
