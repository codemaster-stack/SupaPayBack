const { google } = require('googleapis');

const createGmailTransporter = () => {
  // Create OAuth2 client
   const redirectUri =
  process.env.NODE_ENV === "production"
    ? process.env.GMAIL_REDIRECT_URI_PROD
    : process.env.GMAIL_REDIRECT_URI_LOCAL;

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  redirectUri
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
      console.log(' Testing Gmail OAuth connection...');
      
      // Test by getting user profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      console.log(' Gmail OAuth connection successful!');
      console.log(` Connected to: ${profile.data.emailAddress}`);
      console.log(` Total messages: ${profile.data.messagesTotal}`);
      
      return true;
    } catch (error) {
      console.error(' Gmail OAuth connection failed:', error.message);
      return false;
    }
  };

  // Function to send email using Gmail API
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("🚀 Preparing to send email...");
    console.log("To:", to);
    console.log("From:", process.env.EMAIL_FROM);
    console.log("Subject:", subject);

    const { token } = await oAuth2Client.getAccessToken();
    console.log("✅ Access token retrieved:", token ? "Yes" : "No");

    const email = [
      `To: ${to}`,
      `From: ${process.env.EMAIL_FROM}`,
      `Subject: ${subject || '(no subject)'}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text
    ].join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    console.log('📧 Email sent successfully!');
    console.log(`Message ID: ${result.data.id}`);

    return {
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId
    };

  } catch (error) {
    console.error('❌ Failed to send email');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

  // Run verification only in development

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