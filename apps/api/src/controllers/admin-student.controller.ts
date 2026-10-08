import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../errors/api-error.js';

export class AdminStudentController {
  private getRequestId(req: Request): string | undefined {
    return Array.isArray(req.id) ? req.id[0] : req.id;
  }

  private getRequestMeta(req: Request) {
    const rawIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    const rawAgent = req.headers['user-agent'];
    const userAgent = Array.isArray(rawAgent) ? rawAgent[0] : rawAgent;
    return {
      ipAddress,
      userAgent,
      requestId: this.getRequestId(req),
    };
  }

  listStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const result = await studentService.listStudentsForAdmin(req.user, req.query as any);
      sendSuccess(res, result.data, 200, 'Students retrieved successfully', result.meta, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  getStudentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const student = await studentService.getStudentByIdForAdmin(req.user, this.getParamId(req));
      sendSuccess(res, student, 200, 'Student details retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const meta = this.getRequestMeta(req);
      const updated = await studentService.updateStudentAsAdmin(req.user, this.getParamId(req), req.body, meta);
      sendSuccess(res, updated, 200, 'Student information updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  verifyStudentAcademic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const meta = this.getRequestMeta(req);
      const { status, notes } = req.body;
      const updated = await studentService.verifyAcademicInfo(req.user, this.getParamId(req), status, notes, meta);
      sendSuccess(res, updated, 200, `Student academic status updated to ${status}`, undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };
}

export const adminStudentController = new AdminStudentController();
