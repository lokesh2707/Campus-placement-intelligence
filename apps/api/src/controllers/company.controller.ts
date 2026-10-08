import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../errors/api-error.js';
import { CompanyVerificationStatus, DocumentVerificationStatus } from '@prisma/client';

export class CompanyController {
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

  // ================= COMPANY CRUD =================

  createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const meta = this.getRequestMeta(req);
      const company = await companyService.createCompany(user, req.body, meta);
      sendSuccess(res, company, 201, 'Company created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  listCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const { search, status, verificationStatus, industry, companyType, page, limit } = req.query;

      const result = await companyService.listCompanies(user, {
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? (status as any) : undefined,
        verificationStatus: typeof verificationStatus === 'string' ? (verificationStatus as any) : undefined,
        industry: typeof industry === 'string' ? industry : undefined,
        companyType: typeof companyType === 'string' ? (companyType as any) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(
        res,
        result.companies,
        200,
        'Companies retrieved successfully',
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

  getCompanyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const company = await companyService.getCompanyById(user, companyId);
      sendSuccess(res, company, 200, 'Company details retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.updateCompany(user, companyId, req.body, meta);
      sendSuccess(res, updated, 200, 'Company updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const deleted = await companyService.softDeleteCompany(user, companyId, meta);
      sendSuccess(res, deleted, 200, 'Company deleted successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // ================= VERIFICATION ACTIONS =================

  verifyCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyCompany(
        user,
        companyId,
        CompanyVerificationStatus.VERIFIED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Company verified successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  rejectCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyCompany(
        user,
        companyId,
        CompanyVerificationStatus.REJECTED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Company verification rejected', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  suspendCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.suspendCompany(user, companyId, notes, meta);
      sendSuccess(res, updated, 200, 'Company suspended successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  activateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.activateCompany(user, companyId, meta);
      sendSuccess(res, updated, 200, 'Company activated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  uploadLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.id);
      if (!req.file) {
        throw new ApiError(400, 'NO_FILE_UPLOADED', 'Please upload a logo file');
      }
      const meta = this.getRequestMeta(req);
      const updated = await companyService.uploadLogo(
        user,
        companyId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        meta
      );
      sendSuccess(res, updated, 200, 'Company logo uploaded successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // ================= CONTACTS =================

  getContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const contacts = await companyService.getContacts(user, companyId);
      sendSuccess(res, contacts, 200, 'Company contacts retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const meta = this.getRequestMeta(req);
      const contact = await companyService.createContact(user, companyId, req.body, meta);
      sendSuccess(res, contact, 201, 'Company contact created', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const contactId = this.getParam(req.params.contactId);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.updateContact(user, companyId, contactId, req.body, meta);
      sendSuccess(res, updated, 200, 'Company contact updated', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const contactId = this.getParam(req.params.contactId);
      const meta = this.getRequestMeta(req);
      const deleted = await companyService.deleteContact(user, companyId, contactId, meta);
      sendSuccess(res, deleted, 200, 'Company contact deleted', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // ================= DOCUMENTS =================

  getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const docs = await companyService.getDocuments(user, companyId);
      sendSuccess(res, docs, 200, 'Company documents retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      if (!req.file) {
        throw new ApiError(400, 'NO_FILE_UPLOADED', 'Please upload a document file');
      }
      const meta = this.getRequestMeta(req);
      const documentType = req.body.documentType;
      const created = await companyService.uploadDocument(
        user,
        companyId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        documentType,
        meta
      );
      sendSuccess(res, created, 201, 'Company document uploaded', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  verifyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const documentId = this.getParam(req.params.documentId);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyDocument(
        user,
        companyId,
        documentId,
        DocumentVerificationStatus.VERIFIED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Document verified', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  rejectDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const documentId = this.getParam(req.params.documentId);
      const meta = this.getRequestMeta(req);
      const notes = req.body?.notes;
      const updated = await companyService.verifyDocument(
        user,
        companyId,
        documentId,
        DocumentVerificationStatus.REJECTED,
        notes,
        meta
      );
      sendSuccess(res, updated, 200, 'Document verification rejected', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const documentId = this.getParam(req.params.documentId);
      const meta = this.getRequestMeta(req);
      const deleted = await companyService.deleteDocument(user, companyId, documentId, meta);
      sendSuccess(res, deleted, 200, 'Document deleted', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const documentId = this.getParam(req.params.documentId);
      const { stream, document } = await companyService.getDocumentDownloadStream(user, companyId, documentId);

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };

  // ================= HIRING PREFERENCES =================

  getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const prefs = await companyService.getHiringPreferences(user, companyId);
      sendSuccess(res, prefs, 200, 'Hiring preferences retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = this.getUser(req);
      const companyId = this.getParam(req.params.companyId);
      const meta = this.getRequestMeta(req);
      const updated = await companyService.updateHiringPreferences(user, companyId, req.body, meta);
      sendSuccess(res, updated, 200, 'Hiring preferences updated', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };
}

export const companyController = new CompanyController();
