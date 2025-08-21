const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
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
      }, 10000); // 10 second timeout

      transporter.verify((error, success) => {
        clearTimeout(timeout);
        if (error) {
          console.error('📧 Email transporter verification failed:', error);
          reject(error);
        } else {
          console.log('📧 Email service is ready to send messages');
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
  from: process.env.EMAIL_FROM || 'SupaPay <supaapay@gmail.com>',
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
