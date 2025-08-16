const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  // Gmail configuration
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // This should be your Gmail App Password
    },
    secure: true, // Use SSL
    port: 465
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('📧 Email service is ready to send messages');
    }
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