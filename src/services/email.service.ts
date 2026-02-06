import sgMail from '@sendgrid/mail';
import { config } from '@/config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private initialized = false;

  private initialize(): void {
    if (!this.initialized && config.sendgrid.apiKey) {
      console.log('[EmailService] Initializing SendGrid with API key:', config.sendgrid.apiKey.substring(0, 10) + '...');
      sgMail.setApiKey(config.sendgrid.apiKey);
      this.initialized = true;
    }
  }

  private isConfigured(): boolean {
    const hasApiKey = !!config.sendgrid.apiKey;
    const hasFromEmail = !!config.sendgrid.fromEmail;
    
    console.log('[EmailService] Configuration check:', {
      hasApiKey,
      hasFromEmail,
      fromEmail: config.sendgrid.fromEmail,
    });
    
    return hasApiKey && hasFromEmail;
  }

  /**
   * Send an email using SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    // Initialize SendGrid on first use
    this.initialize();

    if (!this.isConfigured()) {
      const error = 'SendGrid not configured. Missing API key or from email.';
      console.error('[EmailService]', error);
      throw new Error(error);
    }

    try {
      console.log('[EmailService] Preparing to send email:', {
        to: options.to,
        from: config.sendgrid.fromEmail,
        subject: options.subject,
      });

      const msg = {
        to: options.to,
        from: {
          email: config.sendgrid.fromEmail!,
          name: config.sendgrid.fromName || 'Lekki Gathering Place',
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      console.log('[EmailService] Calling SendGrid API...');
      const response = await sgMail.send(msg);
      console.log('[EmailService] SendGrid response:', response[0].statusCode, response[0].headers);
      console.log(`[EmailService] Email sent successfully to ${options.to}`);
    } catch (error: any) {
      console.error('[EmailService] Error sending email:', {
        error: error.message,
        response: error.response?.body,
        to: options.to,
        subject: options.subject,
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    firstName: string
  ): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>We received a request to reset your password for your Lekki Gathering Place account. Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="background-color: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Lekki Gathering Place YSA. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${firstName},

We received a request to reset your password for your Lekki Gathering Place account.

To reset your password, click the link below:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Lekki Gathering Place YSA. All rights reserved.
    `.trim();

    await this.sendEmail({
      to,
      subject: 'Reset Your Password - Lekki Gathering Place',
      html,
      text,
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    const loginUrl = `${config.app.frontendUrl}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Lekki Gathering Place</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Welcome to Lekki Gathering Place! 🎉</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>We're excited to have you join our YSA community! Your account has been successfully created.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to Your Account
              </a>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>Browse and enroll in classes</li>
              <li>Connect with other YSA members</li>
              <li>Access learning materials and resources</li>
              <li>Track your progress and achievements</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to your ward leaders or instructors.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Lekki Gathering Place YSA. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Welcome to Lekki Gathering Place YSA! 🎉',
      html,
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export default new EmailService();
