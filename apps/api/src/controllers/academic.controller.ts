import { Request, Response, NextFunction } from 'express';
import { academicRepository } from '../repositories/academic.repository.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../errors/api-error.js';

export class AcademicController {
  private getRequestId(req: Request): string | undefined {
    return Array.isArray(req.id) ? req.id[0] : req.id;
  }

  // Colleges
  getColleges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const colleges = await academicRepository.findAllColleges();
      sendSuccess(res, colleges, 200, 'Colleges retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  getCollegeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const college = await academicRepository.findCollegeById(id);
      if (!college) throw new ApiError(404, 'COLLEGE_NOT_FOUND', 'College not found');
      sendSuccess(res, college, 200, 'College retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createCollege = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await academicRepository.createCollege(req.body);
      sendSuccess(res, created, 201, 'College created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Campuses
  getCampuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collegeId = (req.query.collegeId as string) || req.user?.collegeId;
      if (!collegeId) {
        throw new ApiError(400, 'MISSING_COLLEGE_ID', 'collegeId query parameter is required');
      }
      const campuses = await academicRepository.findCampusesByCollege(collegeId);
      sendSuccess(res, campuses, 200, 'Campuses retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createCampus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await academicRepository.createCampus(req.body);
      sendSuccess(res, created, 201, 'Campus created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Departments
  getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collegeId = (req.query.collegeId as string) || req.user?.collegeId;
      if (!collegeId) {
        throw new ApiError(400, 'MISSING_COLLEGE_ID', 'collegeId query parameter is required');
      }
      const departments = await academicRepository.findDepartmentsByCollege(collegeId);
      sendSuccess(res, departments, 200, 'Departments retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await academicRepository.createDepartment(req.body);
      sendSuccess(res, created, 201, 'Department created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Degrees
  getDegrees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = req.query.departmentId as string;
      if (!departmentId) {
        throw new ApiError(400, 'MISSING_DEPARTMENT_ID', 'departmentId query parameter is required');
      }
      const degrees = await academicRepository.findDegreesByDepartment(departmentId);
      sendSuccess(res, degrees, 200, 'Degrees retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createDegree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await academicRepository.createDegree(req.body);
      sendSuccess(res, created, 201, 'Degree created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Batches
  getBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const degreeId = req.query.degreeId as string;
      if (!degreeId) {
        throw new ApiError(400, 'MISSING_DEGREE_ID', 'degreeId query parameter is required');
      }
      const batches = await academicRepository.findBatchesByDegree(degreeId);
      sendSuccess(res, batches, 200, 'Batches retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await academicRepository.createBatch(req.body);
      sendSuccess(res, created, 201, 'Batch created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };
}

export const academicController = new AcademicController();
