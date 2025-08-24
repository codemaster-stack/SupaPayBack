const { createGmailTransporter, emailConfig } = require('../config/email');

class EmailService {
  constructor() {
    this.gmailService = createGmailTransporter();
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email using Gmail OAuth
  async sendOTPEmail(email, otp, firstName = 'User') {
    const htmlContent = `
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
    `;

    try {
      if (process.env.NODE_ENV !== 'production') {
  console.log('📧 Sending OTP email via Gmail OAuth to:', email);
}

      
      const result = await this.gmailService.sendEmail({
        to: email,
        subject: emailConfig.templates.otpSubject,

        html: htmlContent
      });

      console.log('✅ OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ OTP email send error:', {
        message: error.message,
        to: email
      });
      return { success: false, error: error.message };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, firstName) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ffa600ff; }
          .welcome-banner { background: linear-gradient(135deg, #ffa600ff, #ffb300ff); 
                           color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .feature-list { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SupaPay</div>
          </div>
          
          <div class="welcome-banner">
            <h2>Welcome to SupaPay, ${firstName}! 🎉</h2>
            <p>Your email has been successfully verified</p>
          </div>
          
          <p>You can now access all SupaPay features and start managing your finances with confidence.</p>
          
          <div class="feature-list">
            <h3>Next Steps:</h3>
            <ul>
              <li>✅ Complete your profile setup</li>
              <li>🔐 Verify your identity (KYC)</li>
              <li>💰 Start managing your finances</li>
              <li>📱 Download our mobile app</li>
            </ul>
          </div>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <div class="footer">
            <p>Best regards,<br><strong>The SupaPay Team</strong></p>
            <p>© 2025 SupaPay. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      console.log('📧 Sending welcome email via Gmail OAuth to:', email);
      
      const result = await this.gmailService.sendEmail({
        to: email,
        subject: emailConfig.templates.welcomeSubject,

        html: htmlContent
      });

      console.log(' Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error(' Welcome email error:', {
        message: error.message,
        to: email
      });
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  // async sendPasswordResetEmail(email, resetToken, firstName = 'User') {
  //   const resetUrl = process.env.NODE_ENV === 'production' 
  //     ? `https://supapay.netlify.app/passwordreset.html?token=${resetToken}`      // Frontend on Netlify
  //     : `http://localhost:3000/passwordreset.html?token=${resetToken}`;           // Local frontend

  //   const htmlContent = `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <style>
  //         body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
  //         .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
  //         .header { text-align: center; margin-bottom: 30px; }
  //         .logo { font-size: 24px; font-weight: bold; color: #ffa600ff; }
  //         .reset-button { display: inline-block; padding: 15px 30px; background-color: #ffa600ff; 
  //                        color: white; text-decoration: none; border-radius: 8px; font-weight: bold; 
  //                        text-align: center; margin: 20px 0; }
  //         .reset-button:hover { background-color: #e6940e; }
  //         .token { font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 8px; 
  //                 word-break: break-all; margin: 15px 0; }
  //         .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
  //         .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="container">
  //         <div class="header">
  //           <div class="logo">SupaPay</div>
  //           <h2>Reset Your Password</h2>
  //         </div>
          
  //         <p>Hello ${firstName},</p>
  //         <p>You requested to reset your password for your SupaPay account. Click the button below to create a new password:</p>
          
  //         <div style="text-align: center;">
  //           <a href="${resetUrl}" class="reset-button">Reset Password</a>
  //         </div>
          
  //         <p>If the button doesn't work, copy and paste this link into your browser:</p>
  //         <div class="token">${resetUrl}</div>
          
  //         <div class="warning">
  //           <strong>Security Notice:</strong>
  //           <ul>
  //             <li>This link will expire in 1 hour for security reasons</li>
  //             <li>If you didn't request this reset, please ignore this email</li>
  //             <li>Never share this link with anyone</li>
  //             <li>Contact support if you have concerns about account security</li>
  //           </ul>
  //         </div>
          
  //         <div class="footer">
  //           <p>© 2025 SupaPay. All rights reserved.</p>
  //           <p>This is an automated message, please do not reply.</p>
  //         </div>
  //       </div>
  //     </body>
  //     </html>
  //   `;

  //   try {
  //     console.log('📧 Sending password reset email via Gmail OAuth to:', email);
  //     console.log('🔗 Reset URL:', resetUrl);
      
  //     const result = await this.gmailService.sendEmail({
  //       to: email,
  //       subject: 'Reset Your SupaPay Password',
  //       html: htmlContent
  //     });

  //     console.log(' Password reset email sent successfully:', result.messageId);
  //     return { success: true, messageId: result.messageId };
      
  //   } catch (error) {
  //     console.error(' Password reset email error:', {
  //       message: error.message,
  //       to: email
  //     });
  //     return { success: false, error: error.message };
  //   }
  // }





  // Send password reset email
async sendPasswordResetEmail(email, resetLink, firstName = 'User') {
  const htmlContent = `
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
          <a href="${resetLink}" class="reset-button">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <div class="token">${resetLink}</div>
        
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
  `;

  try {
    console.log('📧 Sending password reset email via Gmail OAuth to:', email);
    console.log('🔗 Reset Link:', resetLink);
    
    const result = await this.gmailService.sendEmail({
      to: email,
      subject: 'Reset Your SupaPay Password',
      html: htmlContent
    });
    console.log("📨 Gmail API raw response:", result);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Password reset email error:', {
  message: error.message,
  code: error.code,
  response: error.response?.data || error.response,
  stack: error.stack,
  to: email
});
    console.error("❌ Full error object:", JSON.stringify(error, null, 2));

    return { success: false, error: error.message };
  }
}

}


module.exports = new EmailService();