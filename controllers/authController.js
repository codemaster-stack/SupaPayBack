const User = require('../models/User');
const emailService = require('../utils/emailService');
const { emailConfig } = require('../config/email');

class AuthController {
  // Signup controller
  async signup(req, res) {
    try {
      const { 
        email, 
        password, 
        phone, 
        country, 
        account_type, 
        referral_code, 
        otp_method 
      } = req.body;

      // Generate OTP
      const otpCode = emailService.generateOTP();
      const otpExpiry = new Date(Date.now() + emailConfig.otpExpiry * 60 * 1000);

      // Create new user
      const newUser = new User({
        email,
        password,
        phone,
        country,
        accountType: account_type,
        referralCode: referral_code || null,
        otpMethod: otp_method || 'email',
        emailOTP: {
          code: otpCode,
          expiresAt: otpExpiry,
          attempts: 0
        }
      });

      // Save user to database
      await newUser.save();

      // Send OTP email
      const emailResult = await emailService.sendOTPEmail(email, otpCode);
      
      if (!emailResult.success) {
        // If email fails, delete the user and return error
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          error: 'EMAIL_SEND_FAILED'
        });
      }

      // Success response (don't send sensitive data)
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
      
      // Handle duplicate key error (email already exists)
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered',
          error: 'DUPLICATE_EMAIL'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        error: 'SERVER_ERROR'
      });
    }
  }

  // Verify OTP controller
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'ALREADY_VERIFIED'
        });
      }

      // Check if OTP exists
      if (!user.emailOTP || !user.emailOTP.code) {
        return res.status(400).json({
          success: false,
          message: 'No verification code found. Please request a new one.',
          error: 'NO_OTP_FOUND'
        });
      }

      // Check if OTP expired
      if (new Date() > user.emailOTP.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new one.',
          error: 'OTP_EXPIRED'
        });
      }

      // Check OTP attempts (prevent brute force)
      if (user.emailOTP.attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
          error: 'TOO_MANY_ATTEMPTS'
        });
      }

      // Verify OTP
      if (user.emailOTP.code !== otp) {
        // Increment attempts
        user.emailOTP.attempts += 1;
        await user.save();

        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
          error: 'INVALID_OTP',
          attemptsRemaining: 5 - user.emailOTP.attempts
        });
      }

      // OTP is valid - verify email
      user.isEmailVerified = true;
      user.status = 'active';
      user.emailOTP = undefined; // Remove OTP data
      await user.save();

      // Send welcome email
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

  // Resend OTP controller
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

      const user = await User.findOne({ email });
      
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

      // Update user with new OTP
      user.emailOTP = {
        code: otpCode,
        expiresAt: otpExpiry,
        attempts: 0
      };
      await user.save();

      // Send new OTP
      const emailResult = await emailService.sendOTPEmail(email, otpCode);
      
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