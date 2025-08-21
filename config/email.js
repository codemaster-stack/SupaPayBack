const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // false for port 587
    auth: {
      user: process.env.EMAIL_USER,      // 954fa5001@smtp-brevo.com
      pass: process.env.EMAIL_APP_PASSWORD // Your Brevo SMTP key value
    },
    tls: {
      rejectUnauthorized: false
    },
    // Add these timeout settings
    connectionTimeout: 60000,   // 60 seconds
    greetingTimeout: 30000,     // 30 seconds
    socketTimeout: 60000        // 60 seconds
  });

  // Test connection with timeout
  const verifyTransporter = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email verification timeout'));
      }, 15000); // 15 second timeout (increased for better reliability)

      transporter.verify((error, success) => {
        clearTimeout(timeout);
        if (error) {
          console.error('📧 Email transporter verification failed:', {
            error: error.message,
            code: error.code,
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: process.env.SMTP_PORT || 587,
            user: process.env.EMAIL_USER ? ' Set' : ' Missing'
          });
          reject(error);
        } else {
          console.log(' Email service is ready to send messages');
          console.log(' Using Brevo SMTP:', process.env.SMTP_HOST || 'smtp-relay.brevo.com');
          resolve(success);
        }
      });
    });
  };

  // Run verification
  verifyTransporter().catch(err => {
    console.error('Email service initialization failed:', err.message);
  });

  return transporter;
};

const emailConfig = {
  from: process.env.EMAIL_FROM || 'SupaPay <supapay@hotmail.com>',
  otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
  
  // Email templates configuration
  templates: {
    otpSubject: 'Verify Your SupaPay Account',
    welcomeSubject: 'Welcome to SupaPay! 🎉'
  },

  // Rate limiting for emails
  limits: {
    maxOtpPerHour: 5,
    maxOtpPerDay: 20
  }
};

module.exports = {
  createEmailTransporter,
  emailConfig
};