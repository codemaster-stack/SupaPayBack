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
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI // e.g., https://developers.google.com/oauthplayground
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

// Function to create transporter
const createEmailTransporter = async () => {
  try {
    // Get access token
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,           // your Gmail address
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Verify transporter
    transporter.verify((err, success) => {
      if (err) {
        console.error("Email transporter verification failed:", err);
      } else {
        console.log("📧 Gmail OAuth2 transporter is ready to send messages");
      }
    });

    return transporter;
  } catch (err) {
    console.error("Error creating email transporter:", err);
  }
};

// Email configuration
const emailConfig = {
  from: process.env.GMAIL_USER || "SupaPay <supaapay@gmail.com>",
  otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
  templates: {
    otpSubject: "Verify Your SupaPay Account",
    welcomeSubject: "Welcome to SupaPay! 🎉",
  },
  limits: {
    maxOtpPerHour: 5,
    maxOtpPerDay: 20,
  },
};

module.exports = {
  createEmailTransporter,
  emailConfig,
};
