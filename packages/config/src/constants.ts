export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_MINUTES = 30;

export const AUTH_COOKIE_NAME = 'campus_refresh_token';

export const OLLAMA_DEFAULT_HOST = 'http://127.0.0.1:11434';
export const OLLAMA_DEFAULT_MODEL = 'llama3.2';
export const EMBEDDING_DEFAULT_MODEL = 'all-MiniLM-L6-v2';

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
