export interface IEmailService {
  sendVerificationEmail(toEmail: string, token: string, firstName: string): Promise<void>;
  sendPasswordResetEmail(toEmail: string, token: string, firstName: string): Promise<void>;
  sendRecruiterInvitationEmail(toEmail: string, token: string, companyName: string, inviteUrl: string): Promise<void>;
}
