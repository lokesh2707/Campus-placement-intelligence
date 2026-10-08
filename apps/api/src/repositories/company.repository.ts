import {
  Company,
  RecruiterProfile,
  RecruiterInvitation,
  CompanyContact,
  CompanyDocument,
  CompanyHiringPreference,
  CompanyStatus,
  CompanyVerificationStatus,
  CompanyType,
  RecruiterStatus,
  RecruiterVerificationStatus,
  DocumentVerificationStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/database.js';

export interface CompanyListFilter {
  search?: string;
  status?: CompanyStatus;
  verificationStatus?: CompanyVerificationStatus;
  industry?: string;
  companyType?: CompanyType;
  skip?: number;
  take?: number;
  includeDeleted?: boolean;
}

export interface RecruiterListFilter {
  companyId?: string;
  search?: string;
  status?: RecruiterStatus;
  verificationStatus?: RecruiterVerificationStatus;
  skip?: number;
  take?: number;
}

export class CompanyRepository {
  // ================= COMPANY CRUD =================

  async createCompany(data: Prisma.CompanyCreateInput): Promise<Company> {
    return prisma.company.create({ data });
  }

  async findCompanyById(id: string, includeDeleted = false) {
    return prisma.company.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        recruiters: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        contacts: {
          orderBy: { isPrimary: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        hiringPreference: true,
      },
    });
  }

  async findCompanyBySlug(slug: string, includeDeleted = false) {
    return prisma.company.findFirst({
      where: {
        slug,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        recruiters: true,
        contacts: true,
        hiringPreference: true,
      },
    });
  }

  async findCompanyByName(name: string) {
    return prisma.company.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async updateCompany(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  async softDeleteCompany(id: string): Promise<Company> {
    return prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: CompanyStatus.ARCHIVED,
      },
    });
  }

  async listCompanies(filter: CompanyListFilter) {
    const where: Prisma.CompanyWhereInput = {
      deletedAt: filter.includeDeleted ? undefined : null,
    };

    if (filter.status) where.status = filter.status;
    if (filter.verificationStatus) where.verificationStatus = filter.verificationStatus;
    if (filter.companyType) where.companyType = filter.companyType;
    if (filter.industry) where.industry = { equals: filter.industry, mode: 'insensitive' };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
        { industry: { contains: filter.search, mode: 'insensitive' } },
        { headquarters: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: filter.skip ?? 0,
        take: filter.take ?? 20,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              recruiters: true,
              contacts: true,
              documents: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, total };
  }

  // ================= RECRUITER PROFILE =================

  async createRecruiterProfile(data: Prisma.RecruiterProfileCreateInput): Promise<RecruiterProfile> {
    return prisma.recruiterProfile.create({
      data,
      include: {
        company: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async findRecruiterByUserId(userId: string) {
    return prisma.recruiterProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async findRecruiterById(id: string) {
    return prisma.recruiterProfile.findUnique({
      where: { id },
      include: {
        company: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { recruiterProfile: true },
    });
  }

  async updateUserCompany(userId: string, companyId: string, role?: any) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        companyId,
        ...(role ? { role } : {}),
      },
      include: { recruiterProfile: true },
    });
  }

  async createRecruiterUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: { recruiterProfile: true },
    });
  }

  async updateRecruiterProfile(id: string, data: Prisma.RecruiterProfileUpdateInput): Promise<RecruiterProfile> {
    return prisma.recruiterProfile.update({
      where: { id },
      data,
      include: {
        company: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async listRecruiters(filter: RecruiterListFilter) {
    const where: Prisma.RecruiterProfileWhereInput = {};

    if (filter.companyId) where.companyId = filter.companyId;
    if (filter.status) where.status = filter.status;
    if (filter.verificationStatus) where.verificationStatus = filter.verificationStatus;

    if (filter.search) {
      where.OR = [
        { designation: { contains: filter.search, mode: 'insensitive' } },
        { department: { contains: filter.search, mode: 'insensitive' } },
        { workEmail: { contains: filter.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
              { email: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          company: {
            name: { contains: filter.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [recruiters, total] = await Promise.all([
      prisma.recruiterProfile.findMany({
        where,
        skip: filter.skip ?? 0,
        take: filter.take ?? 20,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              verificationStatus: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
      }),
      prisma.recruiterProfile.count({ where }),
    ]);

    return { recruiters, total };
  }

  // ================= RECRUITER INVITATIONS =================

  async createInvitation(data: Prisma.RecruiterInvitationCreateInput): Promise<RecruiterInvitation> {
    return prisma.recruiterInvitation.create({ data });
  }

  async findInvitationByTokenHash(tokenHash: string): Promise<RecruiterInvitation | null> {
    return prisma.recruiterInvitation.findUnique({
      where: { tokenHash },
      include: { company: true },
    });
  }

  async findInvitationByEmailAndCompany(email: string, companyId: string): Promise<RecruiterInvitation | null> {
    return prisma.recruiterInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
        isAccepted: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markInvitationAccepted(id: string): Promise<RecruiterInvitation> {
    return prisma.recruiterInvitation.update({
      where: { id },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
      },
    });
  }

  // ================= COMPANY CONTACTS =================

  async createContact(data: Prisma.CompanyContactCreateInput): Promise<CompanyContact> {
    return prisma.companyContact.create({ data });
  }

  async findContactsByCompany(companyId: string): Promise<CompanyContact[]> {
    return prisma.companyContact.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findContactById(id: string): Promise<CompanyContact | null> {
    return prisma.companyContact.findUnique({ where: { id } });
  }

  async updateContact(id: string, data: Prisma.CompanyContactUpdateInput): Promise<CompanyContact> {
    return prisma.companyContact.update({
      where: { id },
      data,
    });
  }

  async deleteContact(id: string): Promise<CompanyContact> {
    return prisma.companyContact.delete({ where: { id } });
  }

  // ================= COMPANY DOCUMENTS =================

  async createDocument(data: Prisma.CompanyDocumentCreateInput): Promise<CompanyDocument> {
    return prisma.companyDocument.create({ data });
  }

  async findDocumentsByCompany(companyId: string): Promise<CompanyDocument[]> {
    return prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findDocumentById(id: string): Promise<CompanyDocument | null> {
    return prisma.companyDocument.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateDocumentVerification(
    id: string,
    status: DocumentVerificationStatus,
    notes?: string,
    verifiedById?: string
  ): Promise<CompanyDocument> {
    return prisma.companyDocument.update({
      where: { id },
      data: {
        verificationStatus: status,
        verificationNotes: notes,
        verifiedBy: verifiedById ? { connect: { id: verifiedById } } : undefined,
        verifiedAt: new Date(),
      },
    });
  }

  async deleteDocument(id: string): Promise<CompanyDocument> {
    return prisma.companyDocument.delete({ where: { id } });
  }

  // ================= HIRING PREFERENCES =================

  async getHiringPreference(companyId: string): Promise<CompanyHiringPreference | null> {
    return prisma.companyHiringPreference.findUnique({
      where: { companyId },
    });
  }

  async upsertHiringPreference(
    companyId: string,
    data: Prisma.CompanyHiringPreferenceUpdateInput,
    createData: Prisma.CompanyHiringPreferenceCreateInput
  ): Promise<CompanyHiringPreference> {
    return prisma.companyHiringPreference.upsert({
      where: { companyId },
      update: data,
      create: createData,
    });
  }
}

export const companyRepository = new CompanyRepository();
