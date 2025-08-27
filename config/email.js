// require("dotenv").config();
// const nodemailer = require("nodemailer");

// const createEmailTransporter = () => {
//   // Gmail configuration
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_APP_PASSWORD // This should be your Gmail App Password
//     },
//   });

//   // Verify transporter configuration
//   transporter.verify((error, success) => {
//     if (error) {
//       console.error('Email transporter verification failed:', error);
//     } else {
//       console.log('📧 Email service is ready to send messages');
//     }
//   });

//   return transporter;
// };

// const emailConfig = {
//   from: process.env.EMAIL_FROM || 'SupaPay <supaapay@gmail.com>',
//   otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
  
//   // Email templates configuration
//   templates: {
//     otpSubject: 'Verify Your SupaPay Account',
//     welcomeSubject: 'Welcome to SupaPay! 🎉'
//   },

//   // Rate limiting for emails
//   limits: {
//     maxOtpPerHour: 5,
//     maxOtpPerDay: 20
//   }
// };

// module.exports = {
//   createEmailTransporter,
//   emailConfig
// };


require("dotenv").config();
const { Resend } = require("resend");

// Initialize Resend client with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

const emailConfig = {
  from: process.env.EMAIL_FROM || "SupaPay <noreply@supaapay.app>", 
  otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
  templates: {
    otpSubject: "Verify Your SupaPay Account",
    welcomeSubject: "Welcome to SupaPay 🎉",
  },
  limits: {
    maxOtpPerHour: 5,
    maxOtpPerDay: 20,
  },
};

module.exports = {
  resend,
  emailConfig,
};

