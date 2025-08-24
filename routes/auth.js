const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateOTP } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
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
// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    error: 'LOGIN_RATE_LIMIT_EXCEEDED'
  }
});

router.post('/login', loginLimiter, authController.login);

router.get('/user/status/:userId', authenticateToken, authController.getUserStatus);
router.post('/forgot-password', (req, res, next) => {
  console.log('🔥 HIT /api/auth/forgot-password route!');
  console.log('Request body:', req.body);
  next(); // move on to the controller
}, authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

module.exports = router;