import crypto from 'crypto';
import {
  CompanyStatus,
  CompanyVerificationStatus,
  CompanyType,
  RecruiterStatus,
  RecruiterVerificationStatus,
  DocumentVerificationStatus,
  AuditEventType,
  Role,
  UserStatus,
  Prisma,
} from '@prisma/client';
import { CompanyRepository, companyRepository } from '../repositories/company.repository.js';
import { AuditService } from './audit.service.js';
import { IEmailService, getEmailService } from './email/index.js';
import { IStorageService, getStorageService } from './storage/index.js';
import { ApiError } from '../errors/api-error.js';
import { hashPassword } from '../utils/password.js';
import { env } from '../config/env.js';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class CompanyService {
  private companyRepo: CompanyRepository;
  private audit: AuditService;
  private emailService: IEmailService;
  private storage: IStorageService;

  constructor(
    companyRepo?: CompanyRepository,
    audit?: AuditService,
    emailServiceParam?: IEmailService,
    storage?: IStorageService
  ) {
    this.companyRepo = companyRepo ?? companyRepository;
    this.audit = audit ?? new AuditService();
    this.emailService = emailServiceParam ?? getEmailService();
    this.storage = storage ?? getStorageService();
  }

  // ================= UTILITIES =================

  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async getUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = this.generateSlug(baseName);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.companyRepo.findCompanyBySlug(candidate, true);
      if (!existing) {
        return candidate;
      }
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Enforces object-level authorization for company resources.
   * Super Admins & Placement Admins/Coordinators have cross-company access.
   * Recruiters MUST belong to the requested company.
   * Other roles are denied.
   */
  async ensureCompanyAccess(user: { id: string; role: Role }, companyId: string) {
    if (
      user.role === Role.SUPER_ADMIN ||
      user.role === Role.PLACEMENT_ADMIN ||
      user.role === Role.PLACEMENT_COORDINATOR
    ) {
      return;
    }

    if (user.role === Role.RECRUITER) {
      const recruiter = await this.companyRepo.findRecruiterByUserId(user.id);
      if (!recruiter || recruiter.companyId !== companyId) {
        throw new ApiError(403, 'FORBIDDEN', 'Access to this company is restricted to authorized company recruiters');
      }
      if (recruiter.status === RecruiterStatus.SUSPENDED) {
        throw new ApiError(403, 'RECRUITER_SUSPENDED', 'Your recruiter account has been suspended');
      }
      return recruiter;
    }

    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this company');
  }

  // ================= COMPANY MANAGEMENT =================

  async createCompany(
    user: { id: string; role: Role },
    data: {
      name: string;
      legalName?: string | null;
      slug?: string;
      description?: string | null;
      industry: string;
      companyType?: CompanyType;
      website?: string | null;
      logoUrl?: string | null;
      headquarters?: string | null;
      foundedYear?: number | null;
      companySize?: any;
      linkedinUrl?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
    },
    reqMeta?: RequestMeta
  ) {
    const slug = data.slug ? this.generateSlug(data.slug) : await this.getUniqueSlug(data.name);

    const existingSlug = await this.companyRepo.findCompanyBySlug(slug, true);
    if (existingSlug) {
      throw new ApiError(409, 'SLUG_IN_USE', `Company slug '${slug}' is already taken`);
    }

    // Role-based status: Admins can create verified companies; Recruiters register with PENDING
    const isStaff = user.role === Role.SUPER_ADMIN || user.role === Role.PLACEMENT_ADMIN;
    const initialVerificationStatus = isStaff ? CompanyVerificationStatus.VERIFIED : CompanyVerificationStatus.PENDING;

    const company = await this.companyRepo.createCompany({
      name: data.name,
      legalName: data.legalName,
      slug,
      description: data.description,
      industry: data.industry,
      companyType: data.companyType ?? CompanyType.ENTERPRISE,
      website: data.website,
      logoUrl: data.logoUrl,
      headquarters: data.headquarters,
      foundedYear: data.foundedYear,
      companySize: data.companySize ?? 'MEDIUM',
      linkedinUrl: data.linkedinUrl,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      verificationStatus: initialVerificationStatus,
      status: CompanyStatus.ACTIVE,
      verifiedBy: isStaff ? { connect: { id: user.id } } : undefined,
      verifiedAt: isStaff ? new Date() : undefined,
    });

    // If a recruiter registered the company, associate their user with this company
    if (user.role === Role.RECRUITER) {
      const existingProfile = await this.companyRepo.findRecruiterByUserId(user.id);
      if (!existingProfile) {
        await this.companyRepo.createRecruiterProfile({
          user: { connect: { id: user.id } },
          company: { connect: { id: company.id } },
          status: RecruiterStatus.ACTIVE,
          verificationStatus: RecruiterVerificationStatus.PENDING,
        });
      }
      await this.companyRepo.updateUserCompany(user.id, company.id);
    }

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_CREATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId: company.id, name: company.name, slug: company.slug },
    });

    return company;
  }

  async getCompanyById(user: { id: string; role: Role }, companyId: string) {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    // If recruiter, check company access
    if (user.role === Role.RECRUITER) {
      await this.ensureCompanyAccess(user, companyId);
    }

    return company;
  }

  async getCompanyBySlug(user: { id: string; role: Role }, slug: string) {
    const company = await this.companyRepo.findCompanyBySlug(slug);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    if (user.role === Role.RECRUITER) {
      await this.ensureCompanyAccess(user, company.id);
    }

    return company;
  }

  async updateCompany(
    user: { id: string; role: Role },
    companyId: string,
    data: any,
    reqMeta?: RequestMeta
  ) {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    await this.ensureCompanyAccess(user, companyId);

    // Recruiters cannot modify verification status, status, or slug arbitrarily
    const updateData: Prisma.CompanyUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.legalName !== undefined) updateData.legalName = data.legalName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.companyType !== undefined) updateData.companyType = data.companyType;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.headquarters !== undefined) updateData.headquarters = data.headquarters;
    if (data.foundedYear !== undefined) updateData.foundedYear = data.foundedYear;
    if (data.companySize !== undefined) updateData.companySize = data.companySize;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;

    // Only staff can update status or slug
    if (user.role === Role.SUPER_ADMIN || user.role === Role.PLACEMENT_ADMIN) {
      if (data.status) updateData.status = data.status;
      if (data.slug) {
        const cleanSlug = this.generateSlug(data.slug);
        const existing = await this.companyRepo.findCompanyBySlug(cleanSlug);
        if (existing && existing.id !== companyId) {
          throw new ApiError(409, 'SLUG_IN_USE', `Slug '${cleanSlug}' is already taken`);
        }
        updateData.slug = cleanSlug;
      }
    }

    const updated = await this.companyRepo.updateCompany(companyId, updateData);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, updatedFields: Object.keys(updateData) },
    });

    return updated;
  }

  async softDeleteCompany(user: { id: string; role: Role }, companyId: string, reqMeta?: RequestMeta) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can delete companies');
    }

    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    const deleted = await this.companyRepo.softDeleteCompany(companyId);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_DELETED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, name: company.name },
    });

    return deleted;
  }

  async listCompanies(
    user: { id: string; role: Role },
    params: {
      search?: string;
      status?: CompanyStatus;
      verificationStatus?: CompanyVerificationStatus;
      industry?: string;
      companyType?: CompanyType;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Recruiters cannot list all companies unless staff
    if (user.role === Role.RECRUITER) {
      const recruiter = await this.companyRepo.findRecruiterByUserId(user.id);
      if (!recruiter) {
        return { companies: [], total: 0, page, limit, totalPages: 0 };
      }
      const myCompany = await this.companyRepo.findCompanyById(recruiter.companyId);
      return {
        companies: myCompany ? [myCompany] : [],
        total: myCompany ? 1 : 0,
        page: 1,
        limit,
        totalPages: 1,
      };
    }

    const { companies, total } = await this.companyRepo.listCompanies({
      search: params.search,
      status: params.status,
      verificationStatus: params.verificationStatus,
      industry: params.industry,
      companyType: params.companyType,
      skip,
      take: limit,
    });

    return {
      companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ================= VERIFICATION & LIFECYCLE =================

  async verifyCompany(
    adminUser: { id: string; role: Role },
    companyId: string,
    status: CompanyVerificationStatus,
    notes?: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can verify companies');
    }

    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    const updated = await this.companyRepo.updateCompany(companyId, {
      verificationStatus: status,
      verificationNotes: notes || null,
      verifiedBy: { connect: { id: adminUser.id } },
      verifiedAt: new Date(),
    });

    const event =
      status === CompanyVerificationStatus.VERIFIED
        ? AuditEventType.COMPANY_VERIFIED
        : status === CompanyVerificationStatus.REJECTED
        ? AuditEventType.COMPANY_REJECTED
        : AuditEventType.COMPANY_VERIFICATION_SUBMITTED;

    await this.audit.log({
      userId: adminUser.id,
      event,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, status, notes },
    });

    return updated;
  }

  async suspendCompany(
    adminUser: { id: string; role: Role },
    companyId: string,
    notes?: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can suspend companies');
    }

    const updated = await this.companyRepo.updateCompany(companyId, {
      status: CompanyStatus.SUSPENDED,
      verificationNotes: notes || null,
    });

    await this.audit.log({
      userId: adminUser.id,
      event: AuditEventType.COMPANY_SUSPENDED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, notes },
    });

    return updated;
  }

  async activateCompany(
    adminUser: { id: string; role: Role },
    companyId: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can activate companies');
    }

    const updated = await this.companyRepo.updateCompany(companyId, {
      status: CompanyStatus.ACTIVE,
    });

    await this.audit.log({
      userId: adminUser.id,
      event: AuditEventType.COMPANY_ACTIVATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId },
    });

    return updated;
  }

  // ================= RECRUITER INVITATION & PROFILES =================

  async inviteRecruiter(
    user: { id: string; role: Role },
    companyId: string,
    data: { email: string; designation?: string | null },
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    }

    // Check if an existing recruiter profile already exists for this email and company
    const existingUser = await this.companyRepo.findUserByEmail(data.email);

    if (existingUser?.recruiterProfile && existingUser.recruiterProfile.companyId === companyId) {
      throw new ApiError(409, 'ALREADY_RECRUITER', 'A recruiter with this email is already associated with this company');
    }

    // Check if pending active invitation exists
    const pendingInvite = await this.companyRepo.findInvitationByEmailAndCompany(data.email, companyId);
    if (pendingInvite) {
      throw new ApiError(409, 'INVITATION_PENDING', 'An active invitation for this email has already been sent');
    }

    // Generate random secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.companyRepo.createInvitation({
      company: { connect: { id: companyId } },
      invitedBy: { connect: { id: user.id } },
      email: data.email.toLowerCase(),
      tokenHash,
      role: Role.RECRUITER,
      designation: data.designation,
      expiresAt,
    });

    const inviteUrl = `${env.WEB_URL}/auth/recruiter-invite?token=${encodeURIComponent(rawToken)}`;
    await this.emailService.sendRecruiterInvitationEmail(data.email, rawToken, company.name, inviteUrl);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.RECRUITER_INVITED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, email: data.email, invitationId: invitation.id },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      companyId: invitation.companyId ?? companyId,
      expiresAt: invitation.expiresAt,
      simulatedToken: env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async acceptInvitation(
    data: {
      token: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    reqMeta?: RequestMeta
  ) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const invitation = await this.companyRepo.findInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw new ApiError(400, 'INVALID_INVITATION', 'Invalid or expired invitation token');
    }

    if (invitation.isAccepted) {
      throw new ApiError(400, 'INVITATION_ALREADY_ACCEPTED', 'This invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiError(400, 'INVITATION_EXPIRED', 'This invitation has expired');
    }

    let user = await this.companyRepo.findUserByEmail(invitation.email);

    if (!user) {
      if (!data.password || !data.firstName || !data.lastName) {
        throw new ApiError(400, 'MISSING_REGISTRATION_FIELDS', 'Password, first name, and last name are required for new accounts');
      }

      const passwordHash = await hashPassword(data.password);
      user = await this.companyRepo.createRecruiterUser({
        email: invitation.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: Role.RECRUITER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        companyId: invitation.companyId,
      });
    } else {
      // Existing user: ensure role is recruiter and companyId is assigned
      user = await this.companyRepo.updateUserCompany(user.id, invitation.companyId, Role.RECRUITER);
    }

    // Upsert recruiter profile
    let profile = user.recruiterProfile;
    if (!profile) {
      profile = await this.companyRepo.createRecruiterProfile({
        user: { connect: { id: user.id } },
        company: { connect: { id: invitation.companyId } },
        designation: invitation.designation,
        status: RecruiterStatus.ACTIVE,
        verificationStatus: RecruiterVerificationStatus.PENDING,
      });
    } else {
      profile = await this.companyRepo.updateRecruiterProfile(profile.id, {
        company: { connect: { id: invitation.companyId } },
        designation: invitation.designation || profile.designation,
      });
    }

    await this.companyRepo.markInvitationAccepted(invitation.id);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.RECRUITER_CREATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { recruiterId: profile.id, companyId: invitation.companyId },
    });

    return { user, profile };
  }

  async getRecruiterMe(userId: string) {
    const recruiter = await this.companyRepo.findRecruiterByUserId(userId);
    if (!recruiter) {
      throw new ApiError(404, 'RECRUITER_NOT_FOUND', 'No recruiter profile associated with this account');
    }

    const company = await this.companyRepo.findCompanyById(recruiter.companyId);
    return {
      profile: recruiter,
      company,
    };
  }

  async updateRecruiterMe(
    userId: string,
    data: {
      designation?: string | null;
      department?: string | null;
      employeeId?: string | null;
      workEmail?: string | null;
      workPhone?: string | null;
      profilePhoto?: string | null;
    },
    reqMeta?: RequestMeta
  ) {
    const recruiter = await this.companyRepo.findRecruiterByUserId(userId);
    if (!recruiter) {
      throw new ApiError(404, 'RECRUITER_NOT_FOUND', 'Recruiter profile not found');
    }

    const updated = await this.companyRepo.updateRecruiterProfile(recruiter.id, data);

    await this.audit.log({
      userId,
      event: AuditEventType.RECRUITER_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { recruiterId: recruiter.id, updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async listRecruiters(
    user: { id: string; role: Role },
    params: {
      companyId?: string;
      search?: string;
      status?: RecruiterStatus;
      verificationStatus?: RecruiterVerificationStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    let targetCompanyId = params.companyId;

    if (user.role === Role.RECRUITER) {
      const myProfile = await this.companyRepo.findRecruiterByUserId(user.id);
      if (!myProfile) return { recruiters: [], total: 0, page, limit, totalPages: 0 };
      targetCompanyId = myProfile.companyId;
    }

    const { recruiters, total } = await this.companyRepo.listRecruiters({
      companyId: targetCompanyId,
      search: params.search,
      status: params.status,
      verificationStatus: params.verificationStatus,
      skip,
      take: limit,
    });

    return {
      recruiters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecruiterById(user: { id: string; role: Role }, recruiterId: string) {
    const recruiter = await this.companyRepo.findRecruiterById(recruiterId);
    if (!recruiter) {
      throw new ApiError(404, 'RECRUITER_NOT_FOUND', 'Recruiter not found');
    }

    if (user.role === Role.RECRUITER) {
      await this.ensureCompanyAccess(user, recruiter.companyId);
    }

    return recruiter;
  }

  async verifyRecruiter(
    adminUser: { id: string; role: Role },
    recruiterId: string,
    status: RecruiterVerificationStatus,
    notes?: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can verify recruiters');
    }

    const recruiter = await this.companyRepo.findRecruiterById(recruiterId);
    if (!recruiter) {
      throw new ApiError(404, 'RECRUITER_NOT_FOUND', 'Recruiter not found');
    }

    const updated = await this.companyRepo.updateRecruiterProfile(recruiterId, {
      verificationStatus: status,
      verificationNotes: notes || null,
      verifiedBy: { connect: { id: adminUser.id } },
      verifiedAt: new Date(),
    });

    await this.audit.log({
      userId: adminUser.id,
      event: AuditEventType.RECRUITER_VERIFIED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { recruiterId, status, notes },
    });

    return updated;
  }

  async suspendRecruiter(
    adminUser: { id: string; role: Role },
    recruiterId: string,
    notes?: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can suspend recruiters');
    }

    const updated = await this.companyRepo.updateRecruiterProfile(recruiterId, {
      status: RecruiterStatus.SUSPENDED,
      verificationNotes: notes || null,
    });

    await this.audit.log({
      userId: adminUser.id,
      event: AuditEventType.RECRUITER_SUSPENDED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { recruiterId, notes },
    });

    return updated;
  }

  async activateRecruiter(
    adminUser: { id: string; role: Role },
    recruiterId: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can activate recruiters');
    }

    const updated = await this.companyRepo.updateRecruiterProfile(recruiterId, {
      status: RecruiterStatus.ACTIVE,
    });

    await this.audit.log({
      userId: adminUser.id,
      event: AuditEventType.RECRUITER_ACTIVATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { recruiterId },
    });

    return updated;
  }

  // ================= COMPANY CONTACTS =================

  async createContact(
    user: { id: string; role: Role },
    companyId: string,
    data: any,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const contact = await this.companyRepo.createContact({
      company: { connect: { id: companyId } },
      name: data.name,
      designation: data.designation,
      email: data.email.toLowerCase(),
      phone: data.phone,
      contactType: data.contactType || 'HR',
      isPrimary: data.isPrimary ?? false,
    });

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_CONTACT_CREATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, contactId: contact.id, name: contact.name },
    });

    return contact;
  }

  async getContacts(user: { id: string; role: Role }, companyId: string) {
    await this.ensureCompanyAccess(user, companyId);
    return this.companyRepo.findContactsByCompany(companyId);
  }

  async updateContact(
    user: { id: string; role: Role },
    companyId: string,
    contactId: string,
    data: any,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const existing = await this.companyRepo.findContactById(contactId);
    if (!existing || existing.companyId !== companyId) {
      throw new ApiError(404, 'CONTACT_NOT_FOUND', 'Company contact not found');
    }

    const updated = await this.companyRepo.updateContact(contactId, data);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_CONTACT_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, contactId, updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteContact(
    user: { id: string; role: Role },
    companyId: string,
    contactId: string,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const existing = await this.companyRepo.findContactById(contactId);
    if (!existing || existing.companyId !== companyId) {
      throw new ApiError(404, 'CONTACT_NOT_FOUND', 'Company contact not found');
    }

    const deleted = await this.companyRepo.deleteContact(contactId);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_CONTACT_DELETED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, contactId, name: existing.name },
    });

    return deleted;
  }

  // ================= COMPANY DOCUMENTS =================

  async uploadDocument(
    user: { id: string; role: Role },
    companyId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    documentType: any,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new ApiError(400, 'INVALID_FILE_TYPE', 'Company document must be a PDF, JPEG, PNG, or Word document');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (fileBuffer.length > MAX_SIZE) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'Document file size cannot exceed 5 MB');
    }

    const uploadResult = await this.storage.upload(fileBuffer, originalFilename, mimeType, 'company-docs');

    const created = await this.companyRepo.createDocument({
      company: { connect: { id: companyId } },
      uploadedBy: { connect: { id: user.id } },
      documentType: documentType || 'OTHER',
      fileReference: uploadResult.fileKey,
      fileName: originalFilename,
      mimeType,
      fileSize: uploadResult.sizeBytes,
      verificationStatus: DocumentVerificationStatus.PENDING,
    });

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_DOCUMENT_UPLOADED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, documentId: created.id, documentType: created.documentType },
    });

    return created;
  }

  async getDocuments(user: { id: string; role: Role }, companyId: string) {
    await this.ensureCompanyAccess(user, companyId);
    return this.companyRepo.findDocumentsByCompany(companyId);
  }

  async verifyDocument(
    adminUser: { id: string; role: Role },
    companyId: string,
    documentId: string,
    status: DocumentVerificationStatus,
    notes?: string,
    reqMeta?: RequestMeta
  ) {
    if (adminUser.role !== Role.SUPER_ADMIN && adminUser.role !== Role.PLACEMENT_ADMIN) {
      throw new ApiError(403, 'FORBIDDEN', 'Only Placement Administrators can verify company documents');
    }

    const document = await this.companyRepo.findDocumentById(documentId);
    if (!document || document.companyId !== companyId) {
      throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Company document not found');
    }

    const updated = await this.companyRepo.updateDocumentVerification(documentId, status, notes, adminUser.id);

    const event =
      status === DocumentVerificationStatus.VERIFIED
        ? AuditEventType.COMPANY_DOCUMENT_VERIFIED
        : AuditEventType.COMPANY_DOCUMENT_REJECTED;

    await this.audit.log({
      userId: adminUser.id,
      event,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, documentId, status, notes },
    });

    return updated;
  }

  async deleteDocument(
    user: { id: string; role: Role },
    companyId: string,
    documentId: string,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const document = await this.companyRepo.findDocumentById(documentId);
    if (!document || document.companyId !== companyId) {
      throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Company document not found');
    }

    // Delete from storage
    try {
      await this.storage.delete(document.fileReference);
    } catch {
      // Continue even if file already missing on disk
    }

    const deleted = await this.companyRepo.deleteDocument(documentId);

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_DOCUMENT_DELETED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, documentId, fileName: document.fileName },
    });

    return deleted;
  }

  async getDocumentDownloadStream(
    user: { id: string; role: Role },
    companyId: string,
    documentId: string
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const document = await this.companyRepo.findDocumentById(documentId);
    if (!document || document.companyId !== companyId) {
      throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Company document not found');
    }

    const fileStream = await this.storage.getStream(document.fileReference);
    return {
      stream: fileStream,
      document,
    };
  }

  // ================= COMPANY LOGO =================

  async uploadLogo(
    user: { id: string; role: Role },
    companyId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new ApiError(400, 'INVALID_IMAGE_TYPE', 'Logo must be an image (PNG, JPEG, WebP, SVG)');
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (fileBuffer.length > MAX_SIZE) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'Logo file size cannot exceed 2 MB');
    }

    const uploadResult = await this.storage.upload(fileBuffer, originalFilename, mimeType, 'logos');
    const logoUrl = `/api/v1/companies/${companyId}/logo`;

    const updated = await this.companyRepo.updateCompany(companyId, {
      logoUrl: uploadResult.fileKey, // Store storage reference
    });

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId, field: 'logoUrl' },
    });

    return { ...updated, logoUrl };
  }

  // ================= HIRING PREFERENCES =================

  async getHiringPreferences(user: { id: string; role: Role }, companyId: string) {
    await this.ensureCompanyAccess(user, companyId);
    const prefs = await this.companyRepo.getHiringPreference(companyId);
    return prefs || {
      companyId,
      preferredDepartments: [],
      preferredDegrees: [],
      preferredSkills: [],
      preferredLocations: [],
      preferredWorkModes: [],
      minimumCgpa: null,
      maximumBacklogs: null,
      preferredGraduationYears: [],
    };
  }

  async updateHiringPreferences(
    user: { id: string; role: Role },
    companyId: string,
    data: any,
    reqMeta?: RequestMeta
  ) {
    await this.ensureCompanyAccess(user, companyId);

    const updated = await this.companyRepo.upsertHiringPreference(
      companyId,
      {
        preferredDepartments: data.preferredDepartments ?? [],
        preferredDegrees: data.preferredDegrees ?? [],
        preferredSkills: data.preferredSkills ?? [],
        preferredLocations: data.preferredLocations ?? [],
        preferredWorkModes: data.preferredWorkModes ?? [],
        minimumCgpa: data.minimumCgpa ?? null,
        maximumBacklogs: data.maximumBacklogs ?? null,
        preferredGraduationYears: data.preferredGraduationYears ?? [],
      },
      {
        company: { connect: { id: companyId } },
        preferredDepartments: data.preferredDepartments ?? [],
        preferredDegrees: data.preferredDegrees ?? [],
        preferredSkills: data.preferredSkills ?? [],
        preferredLocations: data.preferredLocations ?? [],
        preferredWorkModes: data.preferredWorkModes ?? [],
        minimumCgpa: data.minimumCgpa ?? null,
        maximumBacklogs: data.maximumBacklogs ?? null,
        preferredGraduationYears: data.preferredGraduationYears ?? [],
      }
    );

    await this.audit.log({
      userId: user.id,
      event: AuditEventType.COMPANY_PREFERENCES_UPDATED,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      requestId: reqMeta?.requestId,
      metadata: { companyId },
    });

    return updated;
  }
}

export const companyService = new CompanyService();
