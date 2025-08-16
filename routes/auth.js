const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateOTP } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

// Routes
router.post('/signup', signupLimiter, validateSignup, authController.signup);
router.post('/verify-otp', otpLimiter, validateOTP, authController.verifyOTP);
router.post('/resend-otp', otpLimiter, authController.resendOTP);

module.exports = router;