import { PrismaClient, User, Role, UserStatus } from '@prisma/client';
import { prisma } from './health.repository.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: Role;
  status?: UserStatus;
  emailVerified?: boolean;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export class UserRepository {
  constructor(private db: PrismaClient = prisma) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: null,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        role: data.role || Role.STUDENT,
        status: data.status || UserStatus.PENDING_VERIFICATION,
        emailVerified: data.emailVerified ?? false,
        collegeId: data.collegeId || null,
        departmentId: data.departmentId || null,
        companyId: data.companyId || null,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });
  }

  async markEmailVerified(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });
  }
}

export const userRepository = new UserRepository();
