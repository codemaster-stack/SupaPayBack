const User = require('../models/User');
const emailService = require('../utils/emailService');
const { emailConfig } = require('../config/email');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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



    // LOGIN
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Ensure email verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in"
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        userId: user._id
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // GET USER STATUS
  async getUserStatus(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(200).json({
        kycCompleted: user.kycCompleted || false,
        kycStatus: user.kycStatus || "pending",
        accountType: user.accountType || "personal"
      });

    } catch (error) {
      console.error("User status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

 
  // Forgot Password - Request reset
async forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate reset token (JWT or random string)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/passwordreset.html?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetLink);

    res.json({ success: true, message: "Password reset link sent to your email" });

  } catch (error) {
    console.error("Forgot Password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Reset Password - Confirm new password
async resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password required" });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.resetPasswordToken !== token || Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Update password
    user.password = newPassword; // bcrypt middleware will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password has been reset successfully" });

  } catch (error) {
    console.error("Reset Password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

}

module.exports = new AuthController();
