import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../errors/api-error.js';
import { RecruiterVerificationStatus } from '@prisma/client';

export class RecruiterController {
  private getUser(req: Request) {
    const userId = req.user?.userId || req.user?.sub;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    return { id: userId, role };
  }

  private getRequestId(req: Request): string | undefined {
    return Array.isArray(req.id) ? req.id[0] : req.id;
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
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

  getRecruiterMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const data = await companyService.getRecruiterMe(user.id);
      sendSuccess(res, data, 200, 'Recruiter profile retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateRecruiterMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.updateRecruiterMe(user.id, req.body, meta);
      sendSuccess(res, updated, 200, 'Recruiter profile updated', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  listRecruiters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const { companyId, search, status, verificationStatus, page, limit } = req.query;

      const result = await companyService.listRecruiters(user, {
        companyId: typeof companyId === 'string' ? companyId : undefined,
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? (status as any) : undefined,
        verificationStatus: typeof verificationStatus === 'string' ? (verificationStatus as any) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(
        res,
        result.recruiters,
        200,
        'Recruiters retrieved successfully',
        {
          page: result.page,
          limit: result.limit,
          totalItems: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        },
        this.getRequestId(req)
      );
    } catch (err) {
      next(err);
    }
  };

  getRecruiterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const recruiterId = this.getParam(req.params.id);
      const recruiter = await companyService.getRecruiterById(user, recruiterId);
      sendSuccess(res, recruiter, 200, 'Recruiter details retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  inviteRecruiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const meta = this.getRequestMeta(req);
      const invitation = await companyService.inviteRecruiter(user, companyId, req.body, meta);
      sendSuccess(res, invitation, 201, 'Recruiter invited successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = this.getRequestMeta(req);
      const result = await companyService.acceptInvitation(req.body, meta);
      sendSuccess(res, result, 200, 'Invitation accepted and account configured', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  verifyRecruiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const recruiterId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyRecruiter(
        user,
        recruiterId,
        RecruiterVerificationStatus.VERIFIED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Recruiter verified successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  rejectRecruiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const recruiterId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyRecruiter(
        user,
        recruiterId,
        RecruiterVerificationStatus.REJECTED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Recruiter rejected', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  suspendRecruiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const recruiterId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.suspendRecruiter(user, recruiterId, notes, meta);
      sendSuccess(res, updated, 200, 'Recruiter suspended successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  activateRecruiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const recruiterId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.activateRecruiter(user, recruiterId, meta);
      sendSuccess(res, updated, 200, 'Recruiter activated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };
}

export const recruiterController = new RecruiterController();
