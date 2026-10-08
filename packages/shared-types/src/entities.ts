import { UserRole } from './roles.js';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserDTO extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // computed helper for backward compatibility
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  isActive?: boolean; // backward compatibility alias
  lastLoginAt?: Date | string | null;
  deletedAt?: Date | string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
}

export interface SessionDTO {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  lastUsedAt: Date | string;
  expiresAt: Date | string;
  isCurrent?: boolean;
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_REQUESTED = 'EMAIL_VERIFICATION_REQUESTED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  TOKEN_REFRESH_SUCCESS = 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_REUSE_DETECTED = 'TOKEN_REFRESH_REUSE_DETECTED',
  USER_REGISTERED = 'USER_REGISTERED',
  // Phase 3 Student & Academic Events
  STUDENT_CREATED = 'STUDENT_CREATED',
  STUDENT_UPDATED = 'STUDENT_UPDATED',
  ACADEMIC_INFO_UPDATED = 'ACADEMIC_INFO_UPDATED',
  ACADEMIC_INFO_VERIFIED = 'ACADEMIC_INFO_VERIFIED',
  ACADEMIC_INFO_REJECTED = 'ACADEMIC_INFO_REJECTED',
  SKILL_UPDATED = 'SKILL_UPDATED',
  RESUME_UPLOADED = 'RESUME_UPLOADED',
  RESUME_DELETED = 'RESUME_DELETED',
  // Phase 4 Company & Recruiter Events
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_DELETED = 'COMPANY_DELETED',
  COMPANY_VERIFICATION_SUBMITTED = 'COMPANY_VERIFICATION_SUBMITTED',
  COMPANY_VERIFIED = 'COMPANY_VERIFIED',
  COMPANY_REJECTED = 'COMPANY_REJECTED',
  COMPANY_SUSPENDED = 'COMPANY_SUSPENDED',
  COMPANY_ACTIVATED = 'COMPANY_ACTIVATED',
  RECRUITER_INVITED = 'RECRUITER_INVITED',
  RECRUITER_CREATED = 'RECRUITER_CREATED',
  RECRUITER_UPDATED = 'RECRUITER_UPDATED',
  RECRUITER_VERIFIED = 'RECRUITER_VERIFIED',
  RECRUITER_SUSPENDED = 'RECRUITER_SUSPENDED',
  RECRUITER_ACTIVATED = 'RECRUITER_ACTIVATED',
  COMPANY_DOCUMENT_UPLOADED = 'COMPANY_DOCUMENT_UPLOADED',
  COMPANY_DOCUMENT_VERIFIED = 'COMPANY_DOCUMENT_VERIFIED',
  COMPANY_DOCUMENT_REJECTED = 'COMPANY_DOCUMENT_REJECTED',
  COMPANY_DOCUMENT_DELETED = 'COMPANY_DOCUMENT_DELETED',
  COMPANY_CONTACT_CREATED = 'COMPANY_CONTACT_CREATED',
  COMPANY_CONTACT_UPDATED = 'COMPANY_CONTACT_UPDATED',
  COMPANY_CONTACT_DELETED = 'COMPANY_CONTACT_DELETED',
  COMPANY_PREFERENCES_UPDATED = 'COMPANY_PREFERENCES_UPDATED',
}

export interface AuditLogDTO {
  id: string;
  userId?: string | null;
  event: AuditEventType;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  timestamp: Date | string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'unknown';
      latencyMs?: number;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'optional_disabled';
      latencyMs?: number;
    };
    mlService: {
      status: 'available' | 'unavailable' | 'unknown';
      provider: string;
    };
  };
}

export interface StorageUploadResult {
  fileKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface AIProviderStatus {
  providerName: string;
  isAvailable: boolean;
  defaultModel: string;
  isLocal: boolean;
}

// ==========================================
// Phase 3 — Academic & Student Domain Types
// ==========================================

export enum AcademicVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum SkillProficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum WorkPreference {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
  ANY = 'ANY',
}

export interface CollegeDTO extends BaseEntity {
  name: string;
  code: string;
  website?: string | null;
  location?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CampusDTO extends BaseEntity {
  name: string;
  code: string;
  location?: string | null;
  collegeId: string;
}

export interface DepartmentDTO extends BaseEntity {
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  collegeId: string;
}

export interface DegreeDTO extends BaseEntity {
  name: string;
  code: string;
  departmentId: string;
}

export interface BatchDTO extends BaseEntity {
  name: string;
  startYear: number;
  endYear: number;
  degreeId: string;
}

export interface SkillDTO extends BaseEntity {
  name: string;
  category: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StudentSkillDTO extends BaseEntity {
  studentProfileId: string;
  skillId: string;
  proficiency: SkillProficiency;
  yearsOfExperience: number;
  skill?: SkillDTO;
}

export interface StudentProjectDTO extends BaseEntity {
  studentProfileId: string;
  title: string;
  description: string;
  technologies: string[];
  role?: string | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isCurrent: boolean;
}

export interface StudentInternshipDTO extends BaseEntity {
  studentProfileId: string;
  companyName: string;
  role: string;
  description: string;
  location?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  isCurrent: boolean;
  technologies: string[];
  documentUrl?: string | null;
  verificationStatus: AcademicVerificationStatus;
}

export interface StudentCertificationDTO extends BaseEntity {
  studentProfileId: string;
  name: string;
  issuer: string;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  documentUrl?: string | null;
}

export interface StudentCareerPreferenceDTO extends BaseEntity {
  studentProfileId: string;
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: boolean;
  minimumSalary?: number | null;
  preferredSalary?: number | null;
  currency: string;
  workPreference: WorkPreference;
}

export interface ResumeDTO extends BaseEntity {
  studentProfileId: string;
  fileKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  isActive: boolean;
  uploadedAt: Date | string;
}

export interface ProfileCompletionBreakdown {
  basicInfo: boolean;
  academicInfo: boolean;
  skills: boolean;
  projects: boolean;
  internships: boolean;
  certifications: boolean;
  resume: boolean;
  careerPreferences: boolean;
  score: number; // 0 - 100
}

export interface StudentProfileDTO extends BaseEntity {
  userId: string;
  studentId: string;
  collegeId: string;
  departmentId: string;
  degreeId: string;
  batchId: string;
  graduationYear: number;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  phone?: string | null;
  cgpa?: number | null;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
  diplomaPercentage?: number | null;
  backlogs: number;
  activeBacklogs: number;
  profilePhoto?: string | null;
  bio?: string | null;
  verificationStatus: AcademicVerificationStatus;
  verifiedAt?: Date | string | null;
  verifiedById?: string | null;
  verificationNotes?: string | null;

  // Joined relationships
  user?: UserDTO;
  college?: CollegeDTO;
  department?: DepartmentDTO;
  degree?: DegreeDTO;
  batch?: BatchDTO;
  skills?: StudentSkillDTO[];
  projects?: StudentProjectDTO[];
  internships?: StudentInternshipDTO[];
  certifications?: StudentCertificationDTO[];
  careerPreferences?: StudentCareerPreferenceDTO | null;
  resumes?: ResumeDTO[];
  profileCompletion?: ProfileCompletionBreakdown;
}

export enum CompanyType {
  STARTUP = 'STARTUP',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  MEDIUM_BUSINESS = 'MEDIUM_BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
  MNC = 'MNC',
  GOVERNMENT = 'GOVERNMENT',
  NGO = 'NGO',
  OTHER = 'OTHER',
}

export enum CompanySize {
  MICRO = 'MICRO',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum CompanyVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum RecruiterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum RecruiterVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum CompanyContactType {
  HR = 'HR',
  RECRUITMENT = 'RECRUITMENT',
  TECHNICAL = 'TECHNICAL',
  FINANCE = 'FINANCE',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

export enum CompanyDocumentType {
  REGISTRATION_CERTIFICATE = 'REGISTRATION_CERTIFICATE',
  COMPANY_PAN = 'COMPANY_PAN',
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  AUTHORIZATION_LETTER = 'AUTHORIZATION_LETTER',
  OTHER = 'OTHER',
}

export enum DocumentVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface CompanyContactDTO extends BaseEntity {
  companyId: string;
  name: string;
  designation?: string | null;
  email: string;
  phone?: string | null;
  contactType: CompanyContactType;
  isPrimary: boolean;
}

export interface CompanyDocumentDTO extends BaseEntity {
  companyId: string;
  documentType: CompanyDocumentType;
  fileReference: string;
  fileName: string;
  mimeType: string;
  fileSize: number | bigint;
  uploadedById: string;
  verificationStatus: DocumentVerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: Date | string | null;
  verifiedById?: string | null;
  uploadedBy?: UserDTO;
}

export interface CompanyHiringPreferenceDTO extends BaseEntity {
  companyId: string;
  preferredDepartments: string[];
  preferredDegrees: string[];
  preferredSkills: string[];
  preferredLocations: string[];
  preferredWorkModes: WorkPreference[];
  minimumCgpa?: number | null;
  maximumBacklogs?: number | null;
  preferredGraduationYears: number[];
}

export interface RecruiterProfileDTO extends BaseEntity {
  userId: string;
  companyId: string;
  designation?: string | null;
  department?: string | null;
  employeeId?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  profilePhoto?: string | null;
  status: RecruiterStatus;
  verificationStatus: RecruiterVerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: Date | string | null;
  verifiedById?: string | null;
  user?: UserDTO;
  company?: CompanyDTO;
}

export interface RecruiterInvitationDTO extends BaseEntity {
  companyId: string;
  email: string;
  tokenHash: string;
  role: UserRole;
  designation?: string | null;
  invitedById: string;
  isAccepted: boolean;
  acceptedAt?: Date | string | null;
  expiresAt: Date | string;
  company?: CompanyDTO;
  invitedBy?: UserDTO;
}

export interface CompanyDTO extends BaseEntity {
  name: string;
  legalName?: string | null;
  slug: string;
  description?: string | null;
  industry: string;
  companyType: CompanyType;
  website?: string | null;
  logoUrl?: string | null;
  headquarters?: string | null;
  foundedYear?: number | null;
  companySize: CompanySize;
  linkedinUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: CompanyStatus;
  verificationStatus: CompanyVerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: Date | string | null;
  verifiedById?: string | null;
  deletedAt?: Date | string | null;

  recruiters?: RecruiterProfileDTO[];
  contacts?: CompanyContactDTO[];
  documents?: CompanyDocumentDTO[];
  hiringPreference?: CompanyHiringPreferenceDTO | null;
}
