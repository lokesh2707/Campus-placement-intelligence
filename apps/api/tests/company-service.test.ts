import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyService } from '../src/services/company.service.js';
import {
  Role,
  CompanyStatus,
  CompanyVerificationStatus,
  RecruiterStatus,
  RecruiterVerificationStatus,
  DocumentVerificationStatus,
  CompanyType,
  WorkPreference,
} from '@prisma/client';
import { ApiError } from '../src/errors/api-error.js';

describe('CompanyService — Phase 4 Company & Recruiter Management', () => {
  let companyService: CompanyService;
  let mockRepo: any;
  let mockAudit: any;
  let mockEmail: any;
  let mockStorage: any;

  beforeEach(() => {
    mockRepo = {
      createCompany: vi.fn(),
      findCompanyById: vi.fn(),
      findCompanyBySlug: vi.fn(),
      findCompanyByName: vi.fn(),
      updateCompany: vi.fn(),
      softDeleteCompany: vi.fn(),
      listCompanies: vi.fn(),
      createRecruiterProfile: vi.fn(),
      findRecruiterByUserId: vi.fn(),
      findRecruiterById: vi.fn(),
      updateRecruiterProfile: vi.fn(),
      listRecruiters: vi.fn(),
      createInvitation: vi.fn(),
      findInvitationByTokenHash: vi.fn(),
      findInvitationByEmailAndCompany: vi.fn(),
      markInvitationAccepted: vi.fn(),
      createContact: vi.fn(),
      findContactsByCompany: vi.fn(),
      findContactById: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
      createDocument: vi.fn(),
      findDocumentsByCompany: vi.fn(),
      findDocumentById: vi.fn(),
      updateDocumentVerification: vi.fn(),
      deleteDocument: vi.fn(),
      getHiringPreference: vi.fn(),
      upsertHiringPreference: vi.fn(),
      findUserByEmail: vi.fn(),
      updateUserCompany: vi.fn(),
      createRecruiterUser: vi.fn(),
    };

    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    mockEmail = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
      sendRecruiterInvitationEmail: vi.fn().mockResolvedValue(undefined),
    };

    mockStorage = {
      upload: vi.fn().mockResolvedValue({ fileKey: 'company-docs/test_doc.pdf', sizeBytes: 1024 }),
      delete: vi.fn().mockResolvedValue(undefined),
      getStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
    };

    companyService = new CompanyService(mockRepo, mockAudit, mockEmail, mockStorage);
  });

  // ================= 1. SLUG GENERATION & DUPLICATE RESOLUTION =================
  describe('Slug Generation & Company Creation', () => {
    it('generates a clean URL-friendly slug from company name', () => {
      const slug = companyService.generateSlug('TechNova Solutions & Cloud Services!');
      expect(slug).toBe('technova-solutions-cloud-services');
    });

    it('creates a verified company when created by a Placement Administrator', async () => {
      const adminUser = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findCompanyBySlug.mockResolvedValue(null);
      mockRepo.createCompany.mockImplementation((data: any) => Promise.resolve({ id: 'comp-1', ...data }));

      const result = await companyService.createCompany(adminUser, {
        name: 'TechNova Solutions',
        industry: 'Cloud',
        companyType: CompanyType.ENTERPRISE,
      });

      expect(result.slug).toBe('technova-solutions');
      expect(result.verificationStatus).toBe(CompanyVerificationStatus.VERIFIED);
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('creates a pending company when registered by a Recruiter', async () => {
      const recruiterUser = { id: 'rec-1', role: Role.RECRUITER };
      mockRepo.findCompanyBySlug.mockResolvedValue(null);
      mockRepo.findRecruiterByUserId.mockResolvedValue(null);
      mockRepo.createCompany.mockImplementation((data: any) => Promise.resolve({ id: 'comp-2', ...data }));

      const result = await companyService.createCompany(recruiterUser, {
        name: 'DataForge Labs',
        industry: 'AI',
      });

      expect(result.verificationStatus).toBe(CompanyVerificationStatus.PENDING);
      expect(result.status).toBe(CompanyStatus.ACTIVE);
    });

    it('rejects company creation if custom slug is already in use', async () => {
      const adminUser = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findCompanyBySlug.mockResolvedValue({ id: 'comp-existing', slug: 'taken-slug' });

      await expect(
        companyService.createCompany(adminUser, {
          name: 'Taken Corp',
          slug: 'taken-slug',
          industry: 'IT',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  // ================= 2. OBJECT-LEVEL AUTHORIZATION =================
  describe('Object-Level Authorization Rules', () => {
    const adminUser = { id: 'admin-1', role: Role.SUPER_ADMIN };
    const recruiterA = { id: 'user-rec-a', role: Role.RECRUITER };
    const recruiterB = { id: 'user-rec-b', role: Role.RECRUITER };
    const studentUser = { id: 'user-stud', role: Role.STUDENT };
    const deptCoordinator = { id: 'dept-1', role: Role.DEPARTMENT_COORDINATOR };

    it('allows Super Admin to access any company', async () => {
      await expect(companyService.ensureCompanyAccess(adminUser, 'company-any')).resolves.not.toThrow();
    });

    it('allows Recruiter A to access Company A', async () => {
      mockRepo.findRecruiterByUserId.mockResolvedValue({
        id: 'rec-profile-a',
        companyId: 'company-a',
        status: RecruiterStatus.ACTIVE,
      });

      await expect(companyService.ensureCompanyAccess(recruiterA, 'company-a')).resolves.toBeDefined();
    });

    it('forbids Recruiter A from accessing Company B', async () => {
      mockRepo.findRecruiterByUserId.mockResolvedValue({
        id: 'rec-profile-a',
        companyId: 'company-a',
        status: RecruiterStatus.ACTIVE,
      });

      await expect(companyService.ensureCompanyAccess(recruiterA, 'company-b')).rejects.toThrow(
        /Access to this company is restricted/
      );
    });

    it('forbids Recruiter B from accessing Company A', async () => {
      mockRepo.findRecruiterByUserId.mockResolvedValue({
        id: 'rec-profile-b',
        companyId: 'company-b',
        status: RecruiterStatus.ACTIVE,
      });

      await expect(companyService.ensureCompanyAccess(recruiterB, 'company-a')).rejects.toThrow(
        /Access to this company is restricted/
      );
    });

    it('rejects suspended recruiters from accessing their company', async () => {
      mockRepo.findRecruiterByUserId.mockResolvedValue({
        id: 'rec-profile-a',
        companyId: 'company-a',
        status: RecruiterStatus.SUSPENDED,
      });

      await expect(companyService.ensureCompanyAccess(recruiterA, 'company-a')).rejects.toThrow(
        /suspended/
      );
    });

    it('rejects student and dept coordinator from unauthorized private access', async () => {
      await expect(companyService.ensureCompanyAccess(studentUser, 'company-a')).rejects.toThrow(ApiError);
      await expect(companyService.ensureCompanyAccess(deptCoordinator, 'company-a')).rejects.toThrow(ApiError);
    });
  });

  // ================= 3. COMPANY VERIFICATION & LIFECYCLE =================
  describe('Company Verification & Governance', () => {
    it('verifies a company with administrative remarks', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findCompanyById.mockResolvedValue({ id: 'comp-1', name: 'TechNova' });
      mockRepo.updateCompany.mockResolvedValue({
        id: 'comp-1',
        verificationStatus: CompanyVerificationStatus.VERIFIED,
      });

      const updated = await companyService.verifyCompany(
        admin,
        'comp-1',
        CompanyVerificationStatus.VERIFIED,
        'Valid corporate paperwork verified.'
      );

      expect(updated.verificationStatus).toBe(CompanyVerificationStatus.VERIFIED);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_VERIFIED' })
      );
    });

    it('suspends an active company', async () => {
      const admin = { id: 'admin-1', role: Role.SUPER_ADMIN };
      mockRepo.findCompanyById.mockResolvedValue({ id: 'comp-1', status: CompanyStatus.ACTIVE });
      mockRepo.updateCompany.mockResolvedValue({ id: 'comp-1', status: CompanyStatus.SUSPENDED });

      const suspended = await companyService.suspendCompany(admin, 'comp-1', 'Policy breach');
      expect(suspended.status).toBe(CompanyStatus.SUSPENDED);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_SUSPENDED' })
      );
    });

    it('forbids non-administrators from verifying companies', async () => {
      const recruiter = { id: 'rec-1', role: Role.RECRUITER };
      await expect(
        companyService.verifyCompany(recruiter, 'comp-1', CompanyVerificationStatus.VERIFIED)
      ).rejects.toThrow(/Only Placement Administrators/);
    });
  });

  // ================= 4. RECRUITER INVITATION FLOW =================
  describe('Recruiter Invitation Flow', () => {
    it('generates invitation token and dispatches simulated email', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findCompanyById.mockResolvedValue({ id: 'comp-1', name: 'CloudSphere' });
      mockRepo.findInvitationByEmailAndCompany.mockResolvedValue(null);
      mockRepo.createInvitation.mockImplementation((data: any) => Promise.resolve({ id: 'inv-1', companyId: 'comp-1', ...data }));

      const invite = await companyService.inviteRecruiter(admin, 'comp-1', {
        email: 'recruiter.new@cloudsphere.com',
        designation: 'Campus Head',
      });

      expect(invite.email).toBe('recruiter.new@cloudsphere.com');
      expect(invite.companyId).toBe('comp-1');
      expect(mockEmail.sendRecruiterInvitationEmail).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'RECRUITER_INVITED' })
      );
    });

    it('prevents duplicate active invitations for the same email and company', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findCompanyById.mockResolvedValue({ id: 'comp-1', name: 'CloudSphere' });
      mockRepo.findInvitationByEmailAndCompany.mockResolvedValue({ id: 'existing-invite' });

      await expect(
        companyService.inviteRecruiter(admin, 'comp-1', { email: 'recruiter.new@cloudsphere.com' })
      ).rejects.toThrow(/already been sent/);
    });
  });

  // ================= 5. COMPANY CONTACTS =================
  describe('Company Contacts Management', () => {
    it('creates an authorized company contact', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.createContact.mockResolvedValue({
        id: 'contact-1',
        name: 'Priya Verma',
        contactType: 'HR',
        isPrimary: true,
      });

      const contact = await companyService.createContact(admin, 'comp-1', {
        name: 'Priya Verma',
        email: 'priya@comp.com',
        contactType: 'HR',
        isPrimary: true,
      });

      expect(contact.name).toBe('Priya Verma');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_CONTACT_CREATED' })
      );
    });

    it('deletes a contact when authorized', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.findContactById.mockResolvedValue({ id: 'contact-1', companyId: 'comp-1', name: 'Priya' });
      mockRepo.deleteContact.mockResolvedValue({ id: 'contact-1' });

      await companyService.deleteContact(admin, 'comp-1', 'contact-1');
      expect(mockRepo.deleteContact).toHaveBeenCalledWith('contact-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_CONTACT_DELETED' })
      );
    });
  });

  // ================= 6. COMPLIANCE DOCUMENTS =================
  describe('Company Document Storage & Validation', () => {
    it('uploads a valid PDF document with metadata', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      const buffer = Buffer.from('%PDF-1.4 test document');
      mockRepo.createDocument.mockResolvedValue({
        id: 'doc-1',
        fileName: 'Registration.pdf',
        verificationStatus: DocumentVerificationStatus.PENDING,
      });

      const doc = await companyService.uploadDocument(
        admin,
        'comp-1',
        buffer,
        'Registration.pdf',
        'application/pdf',
        'REGISTRATION_CERTIFICATE'
      );

      expect(doc.fileName).toBe('Registration.pdf');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_DOCUMENT_UPLOADED' })
      );
    });

    it('rejects executable file uploads', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      const buffer = Buffer.from('MZ dangerous executable');

      await expect(
        companyService.uploadDocument(admin, 'comp-1', buffer, 'script.exe', 'application/x-msdownload', 'OTHER')
      ).rejects.toThrow(/PDF, JPEG, PNG, or Word/);
    });

    it('rejects oversized files > 5MB', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      await expect(
        companyService.uploadDocument(admin, 'comp-1', largeBuffer, 'large.pdf', 'application/pdf', 'OTHER')
      ).rejects.toThrow(/cannot exceed 5 MB/);
    });
  });

  // ================= 7. HIRING PREFERENCES =================
  describe('Hiring Preferences', () => {
    it('upserts company recruitment benchmarks', async () => {
      const admin = { id: 'admin-1', role: Role.PLACEMENT_ADMIN };
      mockRepo.upsertHiringPreference.mockResolvedValue({
        companyId: 'comp-1',
        minimumCgpa: 7.5,
        maximumBacklogs: 0,
        preferredWorkModes: [WorkPreference.HYBRID],
      });

      const prefs = await companyService.updateHiringPreferences(admin, 'comp-1', {
        minimumCgpa: 7.5,
        maximumBacklogs: 0,
        preferredWorkModes: [WorkPreference.HYBRID],
      });

      expect(prefs.minimumCgpa).toBe(7.5);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'COMPANY_PREFERENCES_UPDATED' })
      );
    });
  });
});
