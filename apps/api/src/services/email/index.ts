import { DevelopmentEmailProvider } from './development.provider.js';
import { IEmailService } from './email.service.js';

export * from './email.service.js';
export * from './development.provider.js';

// Default to DevelopmentEmailProvider for zero mandatory cost
export const emailService: DevelopmentEmailProvider = new DevelopmentEmailProvider();
export function getEmailService(): IEmailService {
  return emailService;
}
