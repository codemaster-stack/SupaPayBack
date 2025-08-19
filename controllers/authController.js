const User = require('../models/User');
const emailService = require('../utils/emailService');
const { emailConfig } = require('../config/email');

class AuthController {
  // Signup
  async signup(req, res) {
    try {
      const { 
        email, 
        password, 
        phone, 
        country, 
        account_type, accountType,
        referral_code, referralCode,
        otp_method, otpMethod,
        termsAccepted 
      } = req.body;

      if (!email || !password || !phone || !country) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'MISSING_FIELDS'
        });
      }

      if (!termsAccepted) {
        return res.status(400).json({
          success: false,
          message: 'You must accept the terms and conditions to create an account',
          error: 'TERMS_NOT_ACCEPTED'
        });
      }

      const emailLower = email.toLowerCase();

      // Check if email already exists
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered',
          error: 'DUPLICATE_EMAIL'
        });
      }

      // Normalize
      const normalizedAccountType = account_type || accountType || 'user';
      const normalizedReferral = referral_code || referralCode || null;
      const normalizedOtpMethod = otp_method || otpMethod || 'email';

      // Generate OTP
      const otpCode = emailService.generateOTP();
      const otpExpiry = new Date(Date.now() + emailConfig.otpExpiry * 60 * 1000);

      // Create new user
      const newUser = new User({
        email: emailLower,
        password,
        phone,
        country,
        accountType: normalizedAccountType,
        referralCode: normalizedReferral,
        otpMethod: normalizedOtpMethod,
        status: 'pending_verification', // until OTP verified
        termsAccepted: termsAccepted,
        emailOTP: {
          code: otpCode,
          expiresAt: otpExpiry,
          attempts: 0
        }
      });

      await newUser.save();

      // Send OTP email
      const emailResult = await emailService.sendOTPEmail(emailLower, otpCode);
      if (!emailResult.success) {
        await User.findByIdAndDelete(newUser._id); // rollback
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          error: 'EMAIL_SEND_FAILED'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Please check your email for verification code.',
        data: {
          email: newUser.email,
          country: newUser.country,
          accountType: newUser.accountType,
          otpMethod: newUser.otpMethod,
          otpExpiresIn: `${emailConfig.otpExpiry} minutes`
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        error: 'SERVER_ERROR'
      });
    }
  }

  // Verify OTP
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required',
          error: 'MISSING_FIELDS'
        });
      }

      const emailLower = email.toLowerCase();
      const user = await User.findOne({ email: emailLower });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'ALREADY_VERIFIED'
        });
      }

      if (!user.emailOTP?.code) {
        return res.status(400).json({
          success: false,
          message: 'No verification code found. Please request a new one.',
          error: 'NO_OTP_FOUND'
        });
      }

      if (new Date() > user.emailOTP.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new one.',
          error: 'OTP_EXPIRED'
        });
      }

      if (user.emailOTP.attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
          error: 'TOO_MANY_ATTEMPTS'
        });
      }

      if (user.emailOTP.code !== otp) {
        user.emailOTP.attempts += 1;
        await user.save();
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
          error: 'INVALID_OTP',
          attemptsRemaining: 5 - user.emailOTP.attempts
        });
      }

      // OTP valid
      user.isEmailVerified = true;
      user.status = 'active';
      user.emailOTP = undefined; // clear OTP after success
      await user.save();

      await emailService.sendWelcomeEmail(user.email, user.email.split('@')[0]);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully! Welcome to SupaPay.',
        data: {
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
          nextStep: 'login'
        }
      });

    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        error: 'SERVER_ERROR'
      });
    }
  }

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
          error: 'EMAIL_REQUIRED'
        });
      }

      const emailLower = email.toLowerCase();
      const user = await User.findOne({ email: emailLower });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'ALREADY_VERIFIED'
        });
      }

      // Generate new OTP
      const otpCode = emailService.generateOTP();
      const otpExpiry = new Date(Date.now() + emailConfig.otpExpiry * 60 * 1000);

      user.emailOTP = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
      await user.save();

      const emailResult = await emailService.sendOTPEmail(user.email, otpCode);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          error: 'EMAIL_SEND_FAILED'
        });
      }

      res.status(200).json({
        success: true,
        message: 'New verification code sent to your email',
        data: {
          email: user.email,
          otpExpiresIn: `${emailConfig.otpExpiry} minutes`
        }
      });

    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        error: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new AuthController();
