// // generate-refresh-token.js
// const express = require('express');
// const { google } = require('googleapis');

// const app = express();

// require('dotenv').config();

// const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
// const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
// const REDIRECT_URI =
//   process.env.NODE_ENV === "production"
//     ? process.env.GMAIL_REDIRECT_URI_PROD
//     : process.env.GMAIL_REDIRECT_URI_LOCAL;


// const oAuth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// );

// const scopes = [
//   'https://www.googleapis.com/auth/gmail.send',
//   'https://www.googleapis.com/auth/gmail.readonly'
// ];

// // Root route - shows instructions
// app.get('/', (req, res) => {
//   res.send(`
//     <h1>Gmail OAuth Token Generator</h1>
//     <p>Click the link below to start the authorization process:</p>
//     <a href="/auth" style="padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px;">
//       Start Authorization
//     </a>
//   `);
// });

// // Step 1: Generate Auth URL and redirect
// app.get('/auth', (req, res) => {
//   console.log('🔐 Generating authorization URL...');
  
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: scopes,
//     prompt: 'consent' // Forces refresh token generation
//   });
  
//   console.log('📝 Redirecting to Google OAuth...');
//   res.redirect(authUrl);
// });

// // Step 2: Handle OAuth callback
// app.get('/oauth2callback', async (req, res) => {
//   const code = req.query.code;
//   const error = req.query.error;
  
//   if (error) {
//     console.error('❌ OAuth Error:', error);
//     res.send(`<h2>Authorization Error</h2><p>Error: ${error}</p>`);
//     return;
//   }
  
//   if (!code) {
//     console.error('❌ No authorization code received');
//     res.send('<h2>Error</h2><p>No authorization code received</p>');
//     return;
//   }
  
//   console.log('📨 Authorization code received:', code.substring(0, 20) + '...');
  
//   try {
//     console.log('🔄 Exchanging code for tokens...');
//     const { tokens } = await oAuth2Client.getToken(code);
    
//     console.log('\n' + '='.repeat(60));
//     console.log('🎉 SUCCESS! Tokens received:');
//     console.log('='.repeat(60));
//     console.log('📧 ACCESS TOKEN:', tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'Not received');
//     console.log('🔄 REFRESH TOKEN:', tokens.refresh_token ? tokens.refresh_token : 'Not received');
//     console.log('⏰ EXPIRES IN:', tokens.expiry_date ? new Date(tokens.expiry_date) : 'Unknown');
//     console.log('='.repeat(60));
//     console.log('\n💾 Save the REFRESH TOKEN in your environment variables as:');
//     console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
//     console.log('\n✅ You can now close this server (Ctrl+C)');
    
//     res.send(`
//       <h2>✅ Authorization Successful!</h2>
//       <p><strong>Your refresh token has been logged to the console.</strong></p>
//       <p>Check your terminal/command prompt for the token details.</p>
//       <p>You can now close this browser window and stop the server.</p>
//       <div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0; font-family: monospace;">
//         REFRESH TOKEN: ${tokens.refresh_token || 'Not received - check console'}
//       </div>
//     `);
    
//   } catch (err) {
//     console.error('❌ Error exchanging code for tokens:', err.message);
//     console.error('Full error:', err);
//     res.send(`
//       <h2>❌ Error</h2>
//       <p>Failed to exchange authorization code for tokens.</p>
//       <p>Error: ${err.message}</p>
//       <p>Check the console for more details.</p>
//     `);
//   }
// });

// const PORT = process.env.PORT || 3000;

// // 🌍 Use the correct base URL depending on environment
// const baseUrl =
//   process.env.NODE_ENV === "production"
//     ? "https://supapayback.onrender.com" // 👈 Render backend domain
//     : `http://localhost:${PORT}`;

// app.listen(PORT, () => {
//   console.log("=".repeat(60));
//   console.log("🚀 Gmail OAuth Token Generator Started");
//   console.log("=".repeat(60));
//   console.log(`📍 Server running on: ${baseUrl}`);
//   console.log(`👉 Open your browser and visit: ${baseUrl}/auth`); 
//   console.log("=".repeat(60));
// });

