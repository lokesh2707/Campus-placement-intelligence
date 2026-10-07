import { TokenPayload } from '@campus-os/shared-types';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: TokenPayload;
    }
  }
}

export {};
