const { createEmailTransporter, emailConfig } = require('../config/email');

class EmailService {
  constructor() {
    this.transporter = createEmailTransporter();
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  async sendOTPEmail(email, otp, firstName = 'User') {
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Verify Your SupaPay Account',
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ffa600ff; }
          .otp-code { font-size: 32px; font-weight: bold; color: #ffb300ff; text-align: center; 
                     padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; 
                     letter-spacing: 5px; }
          .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SupaPay</div>
            <h2>Verify Your Email Address</h2>
          </div>
          
          <p>Hello ${firstName},</p>
          <p>Welcome to SupaPay! Please use the following verification code to complete your registration:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This verification code will expire in ${emailConfig.otpExpiry} minutes.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
              <li>Never share this code with anyone</li>
              <li>SupaPay will never ask for this code via phone or email</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2025 SupaPay. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Welcome to SupaPay! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Welcome to SupaPay, ${firstName}! 🎉</h2>
          <p>Your email has been successfully verified. You can now access all SupaPay features.</p>
          <p><strong>Next Steps:</strong></p>
            <ul>
            <li>Complete your profile setup</li>
            <li>Verify your identity (KYC)</li>
            <li>Start managing your finances</li>
            </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The SupaPay Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Welcome email error:', error);
    }
  }



  // Inside EmailService class
async sendPasswordResetEmail(email, resetLink, firstName = 'User') {
  const mailOptions = {
    from: emailConfig.from,
    to: email,
    subject: 'Reset Your SupaPay Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ffa600ff; }
          .btn {
            display: inline-block;
            padding: 12px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            margin: 20px 0;
          }
          .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SupaPay</div>
            <h2>Password Reset Request</h2>
          </div>

          <p>Hello ${firstName},</p>
          <p>We received a request to reset your SupaPay password. If this was you, click the button below to reset it:</p>

          <p style="text-align:center;">
            <a href="${resetLink}" class="btn">Reset Password</a>
          </p>

          <p>If you didn’t request a password reset, you can safely ignore this email. This link will expire in 15 minutes.</p>

          <div class="footer">
            <p>© 2025 SupaPay. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const result = await this.transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
}

}

module.exports = new EmailService();