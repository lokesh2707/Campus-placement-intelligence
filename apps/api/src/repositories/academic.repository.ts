import { PrismaClient, College, Campus, Department, Degree, Batch, RecordStatus } from '@prisma/client';
import { prisma } from './health.repository.js';

export class AcademicRepository {
  constructor(private db: PrismaClient = prisma) {}

  // College methods
  async findAllColleges(): Promise<College[]> {
    return this.db.college.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findCollegeById(id: string): Promise<College | null> {
    return this.db.college.findUnique({ where: { id } });
  }

  async findCollegeByCode(code: string): Promise<College | null> {
    return this.db.college.findUnique({ where: { code: code.toUpperCase() } });
  }

  async createCollege(data: { name: string; code: string; website?: string | null; location?: string | null; status?: RecordStatus }): Promise<College> {
    return this.db.college.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        website: data.website || null,
        location: data.location || null,
        status: data.status || RecordStatus.ACTIVE,
      },
    });
  }

  async updateCollege(id: string, data: Partial<College>): Promise<College> {
    return this.db.college.update({
      where: { id },
      data,
    });
  }

  // Campus methods
  async findCampusesByCollege(collegeId: string): Promise<Campus[]> {
    return this.db.campus.findMany({
      where: { collegeId },
      orderBy: { name: 'asc' },
    });
  }

  async findCampusById(id: string): Promise<Campus | null> {
    return this.db.campus.findUnique({ where: { id } });
  }

  async createCampus(data: { name: string; code: string; location?: string | null; collegeId: string }): Promise<Campus> {
    return this.db.campus.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        location: data.location || null,
        collegeId: data.collegeId,
      },
    });
  }

  // Department methods
  async findDepartmentsByCollege(collegeId: string): Promise<Department[]> {
    return this.db.department.findMany({
      where: { collegeId },
      orderBy: { name: 'asc' },
    });
  }

  async findDepartmentById(id: string): Promise<Department | null> {
    return this.db.department.findUnique({ where: { id } });
  }

  async createDepartment(data: { name: string; code: string; collegeId: string; status?: RecordStatus }): Promise<Department> {
    return this.db.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        collegeId: data.collegeId,
        status: data.status || RecordStatus.ACTIVE,
      },
    });
  }

  // Degree methods
  async findDegreesByDepartment(departmentId: string): Promise<Degree[]> {
    return this.db.degree.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
  }

  async findDegreeById(id: string): Promise<Degree | null> {
    return this.db.degree.findUnique({ where: { id } });
  }

  async createDegree(data: { name: string; code: string; departmentId: string }): Promise<Degree> {
    return this.db.degree.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        departmentId: data.departmentId,
      },
    });
  }

  // Batch methods
  async findBatchesByDegree(degreeId: string): Promise<Batch[]> {
    return this.db.batch.findMany({
      where: { degreeId },
      orderBy: { startYear: 'desc' },
    });
  }

  async findBatchById(id: string): Promise<Batch | null> {
    return this.db.batch.findUnique({ where: { id } });
  }

  async createBatch(data: { name: string; startYear: number; endYear: number; degreeId: string }): Promise<Batch> {
    return this.db.batch.create({
      data,
    });
  }
}

export const academicRepository = new AcademicRepository();
