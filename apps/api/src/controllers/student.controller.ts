import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../errors/api-error.js';

export class StudentController {
  private getUserId(req: Request): string {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User not authenticated');
    }
    return userId;
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

  // Profile
  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profile = await studentService.getMyProfile(userId);
      sendSuccess(res, profile, 200, 'Profile retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const meta = this.getRequestMeta(req);
      const profile = await studentService.createProfile(userId, req.body, meta);
      sendSuccess(res, profile, 201, 'Student profile created successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const meta = this.getRequestMeta(req);
      const updated = await studentService.updateMyProfile(userId, req.body, meta);
      sendSuccess(res, updated, 200, 'Profile updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  getStudentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const profile = await studentService.getStudentByIdForAdmin(req.user, this.getParam(req.params.id));
      sendSuccess(res, profile, 200, 'Student profile retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Skills
  listTaxonomySkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string | undefined;
      const skills = await studentService.listTaxonomySkills(category);
      sendSuccess(res, skills, 200, 'Skills retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  getMySkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profile = await studentService.getMyProfile(userId);
      sendSuccess(res, profile.skills || [], 200, 'Student skills retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  addSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { skillId, proficiency, yearsOfExperience } = req.body;
      const result = await studentService.addStudentSkill(userId, skillId, proficiency, yearsOfExperience);
      sendSuccess(res, result, 201, 'Skill added successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const result = await studentService.updateStudentSkill(userId, this.getParam(req.params.skillId), req.body);
      sendSuccess(res, result, 200, 'Skill updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  removeSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await studentService.removeStudentSkill(userId, this.getParam(req.params.skillId));
      sendSuccess(res, null, 200, 'Skill removed successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Projects
  getMyProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const projects = await studentService.getProjects(userId);
      sendSuccess(res, projects, 200, 'Projects retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  addProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const project = await studentService.addProject(userId, req.body);
      sendSuccess(res, project, 201, 'Project added successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const project = await studentService.updateProject(userId, this.getParam(req.params.id), req.body);
      sendSuccess(res, project, 200, 'Project updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await studentService.deleteProject(userId, this.getParam(req.params.id));
      sendSuccess(res, null, 200, 'Project deleted successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Internships
  getMyInternships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const internships = await studentService.getInternships(userId);
      sendSuccess(res, internships, 200, 'Internships retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  addInternship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const internship = await studentService.addInternship(userId, req.body);
      sendSuccess(res, internship, 201, 'Internship added successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateInternship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const internship = await studentService.updateInternship(userId, this.getParam(req.params.id), req.body);
      sendSuccess(res, internship, 200, 'Internship updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteInternship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await studentService.deleteInternship(userId, this.getParam(req.params.id));
      sendSuccess(res, null, 200, 'Internship deleted successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Certifications
  getMyCertifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const certs = await studentService.getCertifications(userId);
      sendSuccess(res, certs, 200, 'Certifications retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  addCertification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const cert = await studentService.addCertification(userId, req.body);
      sendSuccess(res, cert, 201, 'Certification added successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateCertification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const cert = await studentService.updateCertification(userId, this.getParam(req.params.id), req.body);
      sendSuccess(res, cert, 200, 'Certification updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteCertification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await studentService.deleteCertification(userId, this.getParam(req.params.id));
      sendSuccess(res, null, 200, 'Certification deleted successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Career Preferences
  getCareerPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const prefs = await studentService.getCareerPreference(userId);
      sendSuccess(res, prefs, 200, 'Career preferences retrieved', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  updateCareerPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const prefs = await studentService.updateCareerPreference(userId, req.body);
      sendSuccess(res, prefs, 200, 'Career preferences updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  // Resumes
  getMyResumes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const resumes = await studentService.getResumes(userId);
      sendSuccess(res, resumes, 200, 'Resumes retrieved successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  uploadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      if (!req.file) {
        throw new ApiError(400, 'NO_FILE_UPLOADED', 'Please upload a resume file');
      }

      const meta = this.getRequestMeta(req);
      const resume = await studentService.uploadResume(
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        meta
      );

      sendSuccess(res, resume, 201, 'Resume uploaded successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  setActiveResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const updated = await studentService.setActiveResume(userId, this.getParam(req.params.id));
      sendSuccess(res, updated, 200, 'Active resume updated successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  deleteResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const meta = this.getRequestMeta(req);
      await studentService.deleteResume(userId, this.getParam(req.params.id), meta);
      sendSuccess(res, null, 200, 'Resume deleted successfully', undefined, this.getRequestId(req));
    } catch (err) {
      next(err);
    }
  };

  downloadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      const { stream, filename, mimeType } = await studentService.getResumeDownloadStream(req.user, this.getParam(req.params.id));

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
}

export const studentController = new StudentController();
