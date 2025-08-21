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
  console.error('❌ OTP email send error:', {
    message: error.message,
    code: error.code,
    response: error.response,
    to: email
  });
  return { success: false, error: error.message };
}
  }

  // Send welcome email after verification
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

  console.log('🔄 Sending Welcome email to:', email);
  console.log('📧 From:', emailConfig.from);

  try {
    const result = await this.transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Welcome email error:', {
      message: error.message,
      code: error.code,
      response: error.response,
      to: email
    });
    return { success: false, error: error.message };
  }
}


  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, firstName = 'User') {
    const resetUrl = process.env.NODE_ENV === 'production' 
  ? `https://supapay.netlify.app/passwordreset.html?token=${resetToken}`      // Frontend on Netlify
  : `http://localhost:3000/passwordreset.html?token=${resetToken}`;           // Local frontend
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
            .reset-button { display: inline-block; padding: 15px 30px; background-color: #ffa600ff; 
                           color: white; text-decoration: none; border-radius: 8px; font-weight: bold; 
                           text-align: center; margin: 20px 0; }
            .reset-button:hover { background-color: #e6940e; }
            .token { font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 8px; 
                    word-break: break-all; margin: 15px 0; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SupaPay</div>
              <h2>Reset Your Password</h2>
            </div>
            
            <p>Hello ${firstName},</p>
            <p>You requested to reset your password for your SupaPay account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="token">${resetUrl}</div>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>Contact support if you have concerns about account security</li>
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
  console.log('🔄 Sending reset email to:', email);
  console.log('🔗 Reset URL:', resetUrl);
  console.log('📧 From:', emailConfig.from);
  
  const result = await this.transporter.sendMail(mailOptions);
  
  console.log(' Reset email result:', {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
    pending: result.pending
  });
  
  return { success: true, messageId: result.messageId };
} catch (error) {
  console.error(' Reset email full error:', {
    message: error.message,
    code: error.code,
    response: error.response
  });
  return { success: false, error: error.message };
}
  }
}

module.exports = new EmailService();