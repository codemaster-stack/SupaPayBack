const { google } = require('googleapis');

const createGmailTransporter = () => {
  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback' // Not used for sending, but required
  );

  // Set the refresh token
  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  // Create Gmail API instance
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Test the connection
  const verifyConnection = async () => {
    try {
      console.log('🔐 Testing Gmail OAuth connection...');
      
      // Test by getting user profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      console.log('✅ Gmail OAuth connection successful!');
      console.log(`📧 Connected to: ${profile.data.emailAddress}`);
      console.log(`📊 Total messages: ${profile.data.messagesTotal}`);
      
      return true;
    } catch (error) {
      console.error('❌ Gmail OAuth connection failed:', error.message);
      return false;
    }
  };

  // Function to send email using Gmail API
  const sendEmail = async ({ to, subject, text, html }) => {
    try {
      // Create email content
      const email = [
        `To: ${to}`,
        `From: ${process.env.EMAIL_FROM}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html || text
      ].join('\n');

      // Encode email in base64url format
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });

      console.log('📨 Email sent successfully!');
      console.log(`📬 Message ID: ${result.data.id}`);
      
      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  };

  // Run verification on creation
  verifyConnection();

  return {
    sendEmail,
    verifyConnection,
    gmail // Expose gmail instance if needed
  };
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
  createGmailTransporter,
  emailConfig
};