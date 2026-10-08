import { Router } from 'express';
import { healthRouter } from '../health/health.routes.js';
import { authRouter } from './auth.routes.js';
import { academicRouter } from './academic.routes.js';
import { studentRouter } from './student.routes.js';
import { adminStudentRouter } from './admin-student.routes.js';
import { companyRouter } from './company.routes.js';
import { recruiterRouter } from './recruiter.routes.js';
import { API_VERSION } from '@campus-os/config';
import { sendSuccess } from '../utils/response.js';

export const v1Router = Router();

v1Router.get('/', (req, res) => {
  sendSuccess(res, {
    name: 'AI-Powered Campus Placement Intelligence Platform API',
    version: API_VERSION,
    status: 'operational',
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      readiness: `/api/${API_VERSION}/health/ready`,
      auth: `/api/${API_VERSION}/auth`,
      academic: `/api/${API_VERSION}/colleges`,
      students: `/api/${API_VERSION}/students/me`,
      adminStudents: `/api/${API_VERSION}/admin/students`,
      companies: `/api/${API_VERSION}/companies`,
      recruiters: `/api/${API_VERSION}/recruiters/me`,
    },
  }, 200, undefined, undefined, req.id);
});

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/', academicRouter);
v1Router.use('/', studentRouter);
v1Router.use('/', adminStudentRouter);
v1Router.use('/', companyRouter);
v1Router.use('/', recruiterRouter);
