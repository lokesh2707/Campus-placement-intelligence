import {
  StudentProfileDTO,
  ProfileCompletionBreakdown,
  AcademicVerificationStatus,
  SkillProficiency,
  AuditEventType,
  UserRole,
  TokenPayload,
} from '@campus-os/shared-types';
import { studentRepository, StudentRepository, StudentFilterParams } from '../repositories/student.repository.js';
import { academicRepository, AcademicRepository } from '../repositories/academic.repository.js';
import { auditService, AuditService } from './audit.service.js';
import { getStorageService, IStorageService } from './storage/index.js';
import { ApiError } from '../errors/api-error.js';
import { Readable } from 'node:stream';

export class StudentService {
  constructor(
    private studentRepo: StudentRepository = studentRepository,
    private academicRepo: AcademicRepository = academicRepository,
    private audit: AuditService = auditService,
    private storage: IStorageService = getStorageService()
  ) {}

  /**
   * Deterministic Profile Completion calculation
   */
  calculateProfileCompletion(profile: any): ProfileCompletionBreakdown {
    const basicInfo = Boolean(profile.phone && (profile.bio || profile.profilePhoto));
    const academicInfo = Boolean(
      profile.cgpa !== null &&
      profile.cgpa !== undefined &&
      profile.tenthPercentage !== null &&
      profile.twelfthPercentage !== null
    );
    const skills = Boolean(profile.skills && profile.skills.length >= 3);
    const projects = Boolean(profile.projects && profile.projects.length >= 1);
    const internships = Boolean(profile.internships && profile.internships.length >= 1);
    const certifications = Boolean(profile.certifications && profile.certifications.length >= 1);
    const resume = Boolean(profile.resumes && profile.resumes.some((r: any) => r.isActive));
    const careerPreferences = Boolean(
      profile.careerPreference &&
      profile.careerPreference.preferredRoles &&
      profile.careerPreference.preferredRoles.length > 0
    );

    let score = 0;
    if (basicInfo) score += 15;
    if (academicInfo) score += 20;
    if (skills) score += 20;
    if (projects) score += 15;
    if (internships) score += 10;
    if (certifications) score += 5;
    if (resume) score += 15;

    return {
      basicInfo,
      academicInfo,
      skills,
      projects,
      internships,
      certifications,
      resume,
      careerPreferences,
      score: Math.min(score, 100),
    };
  }

  private enrichProfile(profile: any): StudentProfileDTO {
    const completion = this.calculateProfileCompletion(profile);
    return {
      ...profile,
      profileCompletion: completion,
    };
  }

  // ====================
  // Student Self Management
  // ====================

  async getMyProfile(userId: string): Promise<StudentProfileDTO> {
    const profile = await this.studentRepo.findByUserId(userId);
    if (!profile) {
      throw new ApiError(404, 'STUDENT_PROFILE_NOT_FOUND', 'Student profile has not been created yet');
    }
    return this.enrichProfile(profile);
  }

  async createProfile(userId: string, data: any, reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }): Promise<StudentProfileDTO> {
    const existing = await this.studentRepo.findByUserId(userId);
    if (existing) {
      throw new ApiError(409, 'STUDENT_PROFILE_EXISTS', 'Student profile already exists for this account');
    }

    const regExists = await this.studentRepo.findByStudentId(data.studentId);
    if (regExists) {
      throw new ApiError(409, 'REGISTRATION_NUMBER_EXISTS', 'Registration number is already registered');
    }

    // Verify academic foreign keys
    const [college, department, degree, batch] = await Promise.all([
      this.academicRepo.findCollegeById(data.collegeId),
      this.academicRepo.findDepartmentById(data.departmentId),
      this.academicRepo.findDegreeById(data.degreeId),
      this.academicRepo.findBatchById(data.batchId),
    ]);

    if (!college) throw new ApiError(400, 'INVALID_COLLEGE', 'Specified college does not exist');
    if (!department || department.collegeId !== data.collegeId) {
      throw new ApiError(400, 'INVALID_DEPARTMENT', 'Specified department does not belong to the selected college');
    }
    if (!degree || degree.departmentId !== data.departmentId) {
      throw new ApiError(400, 'INVALID_DEGREE', 'Specified degree does not belong to the selected department');
    }
    if (!batch || batch.degreeId !== data.degreeId) {
      throw new ApiError(400, 'INVALID_BATCH', 'Specified batch does not belong to the selected degree');
    }

    const created = await this.studentRepo.createProfile({
      userId,
      studentId: data.studentId,
      collegeId: data.collegeId,
      departmentId: data.departmentId,
      degreeId: data.degreeId,
      batchId: data.batchId,
      graduationYear: data.graduationYear,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender,
      phone: data.phone,
      cgpa: data.cgpa,
      tenthPercentage: data.tenthPercentage,
      twelfthPercentage: data.twelfthPercentage,
      diplomaPercentage: data.diplomaPercentage,
      backlogs: data.backlogs,
      activeBacklogs: data.activeBacklogs,
      bio: data.bio,
      profilePhoto: data.profilePhoto,
    });

    await this.audit.log({
      userId,
      event: AuditEventType.STUDENT_CREATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { studentProfileId: created.id, studentId: created.studentId },
    });

    return this.enrichProfile(created);
  }

  async updateMyProfile(userId: string, data: any, reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }): Promise<StudentProfileDTO> {
    const profile = await this.studentRepo.findByUserId(userId);
    if (!profile) {
      throw new ApiError(404, 'STUDENT_PROFILE_NOT_FOUND', 'Student profile does not exist');
    }

    // Students can ONLY update personal self-managed fields
    const allowedUpdates: any = {};
    if (data.phone !== undefined) allowedUpdates.phone = data.phone;
    if (data.bio !== undefined) allowedUpdates.bio = data.bio;
    if (data.profilePhoto !== undefined) allowedUpdates.profilePhoto = data.profilePhoto;
    if (data.dateOfBirth !== undefined) allowedUpdates.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) allowedUpdates.gender = data.gender;

    const updated = await this.studentRepo.updateProfile(profile.id, allowedUpdates);

    await this.audit.log({
      userId,
      event: AuditEventType.STUDENT_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { fieldsUpdated: Object.keys(allowedUpdates) },
    });

    return this.enrichProfile(updated);
  }

  // ====================
  // Skills Management
  // ====================

  async listTaxonomySkills(category?: string) {
    return this.studentRepo.listTaxonomySkills(category);
  }

  async addStudentSkill(
    userId: string,
    skillId: string,
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE,
    yearsOfExperience = 0
  ) {
    const profile = await this.getMyProfile(userId);
    const skill = await this.studentRepo.findSkillById(skillId);
    if (!skill) {
      throw new ApiError(404, 'SKILL_NOT_FOUND', 'Skill was not found in taxonomy');
    }

    const existing = await this.studentRepo.findStudentSkill(profile.id, skillId);
    if (existing) {
      throw new ApiError(409, 'SKILL_ALREADY_ADDED', 'Skill is already in your skill profile');
    }

    const added = await this.studentRepo.addStudentSkill(profile.id, skillId, proficiency, yearsOfExperience);

    await this.audit.log({
      userId,
      event: AuditEventType.SKILL_UPDATED,
      metadata: { action: 'ADD', skillId, skillName: skill.name },
    });

    return added;
  }

  async updateStudentSkill(userId: string, skillId: string, data: { proficiency?: SkillProficiency; yearsOfExperience?: number }) {
    const profile = await this.getMyProfile(userId);
    const existing = await this.studentRepo.findStudentSkill(profile.id, skillId);
    if (!existing) {
      throw new ApiError(404, 'STUDENT_SKILL_NOT_FOUND', 'Skill is not in student profile');
    }

    const updated = await this.studentRepo.updateStudentSkill(profile.id, skillId, data);

    await this.audit.log({
      userId,
      event: AuditEventType.SKILL_UPDATED,
      metadata: { action: 'UPDATE', skillId },
    });

    return updated;
  }

  async removeStudentSkill(userId: string, skillId: string) {
    const profile = await this.getMyProfile(userId);
    const existing = await this.studentRepo.findStudentSkill(profile.id, skillId);
    if (!existing) {
      throw new ApiError(404, 'STUDENT_SKILL_NOT_FOUND', 'Skill is not in student profile');
    }

    await this.studentRepo.removeStudentSkill(profile.id, skillId);

    await this.audit.log({
      userId,
      event: AuditEventType.SKILL_UPDATED,
      metadata: { action: 'REMOVE', skillId },
    });
  }

  // ====================
  // Projects Management
  // ====================

  async getProjects(userId: string) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.getProjects(profile.id);
  }

  async addProject(userId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.addProject(profile.id, data);
  }

  async updateProject(userId: string, projectId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    const project = await this.studentRepo.findProjectById(projectId);
    if (!project || project.studentProfileId !== profile.id) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found or not owned by student');
    }
    return this.studentRepo.updateProject(projectId, profile.id, data);
  }

  async deleteProject(userId: string, projectId: string) {
    const profile = await this.getMyProfile(userId);
    const project = await this.studentRepo.findProjectById(projectId);
    if (!project || project.studentProfileId !== profile.id) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found or not owned by student');
    }
    await this.studentRepo.deleteProject(projectId);
  }

  // ====================
  // Internships Management
  // ====================

  async getInternships(userId: string) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.getInternships(profile.id);
  }

  async addInternship(userId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.addInternship(profile.id, data);
  }

  async updateInternship(userId: string, internshipId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    const internship = await this.studentRepo.findInternshipById(internshipId);
    if (!internship || internship.studentProfileId !== profile.id) {
      throw new ApiError(404, 'INTERNSHIP_NOT_FOUND', 'Internship record not found or not owned by student');
    }
    return this.studentRepo.updateInternship(internshipId, data);
  }

  async deleteInternship(userId: string, internshipId: string) {
    const profile = await this.getMyProfile(userId);
    const internship = await this.studentRepo.findInternshipById(internshipId);
    if (!internship || internship.studentProfileId !== profile.id) {
      throw new ApiError(404, 'INTERNSHIP_NOT_FOUND', 'Internship record not found or not owned by student');
    }
    await this.studentRepo.deleteInternship(internshipId);
  }

  // ====================
  // Certifications Management
  // ====================

  async getCertifications(userId: string) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.getCertifications(profile.id);
  }

  async addCertification(userId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.addCertification(profile.id, data);
  }

  async updateCertification(userId: string, certId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    const cert = await this.studentRepo.findCertificationById(certId);
    if (!cert || cert.studentProfileId !== profile.id) {
      throw new ApiError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found or not owned by student');
    }
    return this.studentRepo.updateCertification(certId, data);
  }

  async deleteCertification(userId: string, certId: string) {
    const profile = await this.getMyProfile(userId);
    const cert = await this.studentRepo.findCertificationById(certId);
    if (!cert || cert.studentProfileId !== profile.id) {
      throw new ApiError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found or not owned by student');
    }
    await this.studentRepo.deleteCertification(certId);
  }

  // ====================
  // Career Preferences Management
  // ====================

  async getCareerPreference(userId: string) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.getCareerPreference(profile.id);
  }

  async updateCareerPreference(userId: string, data: any) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.upsertCareerPreference(profile.id, data);
  }

  // ====================
  // Resume Management & Storage
  // ====================

  async getResumes(userId: string) {
    const profile = await this.getMyProfile(userId);
    return this.studentRepo.getResumes(profile.id);
  }

  async uploadResume(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }
  ) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new ApiError(400, 'INVALID_FILE_TYPE', 'Resume must be a PDF or Word document (.pdf, .docx, .doc)');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (fileBuffer.length > MAX_SIZE) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'Resume file size cannot exceed 5 MB');
    }

    const profile = await this.getMyProfile(userId);
    const existingResumes = await this.studentRepo.getResumes(profile.id);
    const nextVersion = existingResumes.length > 0 ? Math.max(...existingResumes.map((r: any) => r.version)) + 1 : 1;

    // Upload via storage abstraction
    const uploadResult = await this.storage.upload(fileBuffer, originalFilename, mimeType, 'resumes');

    const created = await this.studentRepo.createResume({
      studentProfileId: profile.id,
      fileKey: uploadResult.fileKey,
      originalFilename,
      mimeType,
      sizeBytes: uploadResult.sizeBytes,
      version: nextVersion,
      isActive: existingResumes.length === 0, // Auto-activate if first resume
    });

    await this.audit.log({
      userId,
      event: AuditEventType.RESUME_UPLOADED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { resumeId: created.id, version: nextVersion, filename: originalFilename },
    });

    return created;
  }

  async setActiveResume(userId: string, resumeId: string) {
    const profile = await this.getMyProfile(userId);
    const resume = await this.studentRepo.findResumeById(resumeId);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found or does not belong to you');
    }

    return this.studentRepo.setActiveResume(profile.id, resumeId);
  }

  async deleteResume(userId: string, resumeId: string, reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }) {
    const profile = await this.getMyProfile(userId);
    const resume = await this.studentRepo.findResumeById(resumeId);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found or does not belong to you');
    }

    // Delete underlying stored file
    try {
      await this.storage.delete(resume.fileKey);
    } catch {
      // Ignore if already deleted from storage
    }

    await this.studentRepo.deleteResume(resumeId);

    // If deleted resume was active, set the most recent remaining resume as active
    const remaining = await this.studentRepo.getResumes(profile.id);
    if (resume.isActive && remaining.length > 0) {
      await this.studentRepo.setActiveResume(profile.id, remaining[0].id);
    }

    await this.audit.log({
      userId,
      event: AuditEventType.RESUME_DELETED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { resumeId, filename: resume.originalFilename },
    });
  }

  async getResumeDownloadStream(
    user: TokenPayload,
    resumeId: string
  ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
    const resume = await this.studentRepo.findResumeById(resumeId);
    if (!resume) {
      throw new ApiError(404, 'RESUME_NOT_FOUND', 'Requested resume could not be found');
    }

    // Authorization check
    const studentProfile = await this.studentRepo.findById(resume.studentProfileId);
    if (!studentProfile) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student profile does not exist');
    }

    const requesterUserId = user.userId || user.sub;
    const isOwner = studentProfile.userId === requesterUserId;
    const isInstitutionAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PLACEMENT_ADMIN;
    const isDeptCoordForStudent =
      user.role === UserRole.DEPARTMENT_COORDINATOR && user.departmentId === studentProfile.departmentId;

    if (!isOwner && !isInstitutionAdmin && !isDeptCoordForStudent) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this resume');
    }

    const stream = await this.storage.getStream(resume.fileKey);
    return {
      stream,
      filename: resume.originalFilename,
      mimeType: resume.mimeType,
    };
  }

  // ============================================
  // Admin & Department Coordinator Operations
  // ============================================

  async listStudentsForAdmin(user: TokenPayload, queryParams: StudentFilterParams) {
    const filters: StudentFilterParams = { ...queryParams };

    // Object-level authorization for department coordinators
    if (user.role === UserRole.DEPARTMENT_COORDINATOR) {
      if (!user.departmentId) {
        throw new ApiError(403, 'NO_DEPARTMENT_ASSIGNED', 'Department coordinator does not have an assigned department');
      }
      filters.departmentId = user.departmentId;
    }

    const { students, total } = await this.studentRepo.findMany(filters);
    const enriched = students.map((s: any) => this.enrichProfile(s));

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: enriched,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getStudentByIdForAdmin(user: TokenPayload, studentProfileId: string) {
    const profile = await this.studentRepo.findById(studentProfileId);
    if (!profile) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student profile not found');
    }

    // Enforce department scoping for department coordinators
    if (user.role === UserRole.DEPARTMENT_COORDINATOR && profile.departmentId !== user.departmentId) {
      throw new ApiError(403, 'FORBIDDEN_DEPARTMENT', 'You are not authorized to view students outside your department');
    }

    return this.enrichProfile(profile);
  }

  async updateStudentAsAdmin(
    user: TokenPayload,
    studentProfileId: string,
    data: any,
    reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }
  ) {
    const profile = await this.studentRepo.findById(studentProfileId);
    if (!profile) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student profile not found');
    }

    if (user.role === UserRole.DEPARTMENT_COORDINATOR && profile.departmentId !== user.departmentId) {
      throw new ApiError(403, 'FORBIDDEN_DEPARTMENT', 'You cannot modify students outside your department');
    }

    const updated = await this.studentRepo.updateProfile(studentProfileId, data);

    await this.audit.log({
      userId: user.userId || user.sub,
      event: AuditEventType.ACADEMIC_INFO_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { targetStudentId: studentProfileId, updatedFields: Object.keys(data) },
    });

    return this.enrichProfile(updated);
  }

  async verifyAcademicInfo(
    user: TokenPayload,
    studentProfileId: string,
    status: AcademicVerificationStatus,
    notes?: string | null,
    reqMeta?: { ipAddress?: string; userAgent?: string; requestId?: string }
  ) {
    const profile = await this.studentRepo.findById(studentProfileId);
    if (!profile) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student profile not found');
    }

    if (user.role === UserRole.DEPARTMENT_COORDINATOR && profile.departmentId !== user.departmentId) {
      throw new ApiError(403, 'FORBIDDEN_DEPARTMENT', 'You cannot verify students outside your department');
    }

    const updated = await this.studentRepo.updateProfile(studentProfileId, {
      verificationStatus: status,
      verifiedAt: new Date(),
      verifiedById: user.userId || user.sub,
      verificationNotes: notes || null,
    });

    const event = status === AcademicVerificationStatus.VERIFIED
      ? AuditEventType.ACADEMIC_INFO_VERIFIED
      : AuditEventType.ACADEMIC_INFO_REJECTED;

    await this.audit.log({
      userId: user.userId || user.sub,
      event,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { targetStudentId: studentProfileId, status, notes },
    });

    return this.enrichProfile(updated);
  }
}

export const studentService = new StudentService();
