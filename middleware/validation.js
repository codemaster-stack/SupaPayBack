const User = require('../models/User');

// Validate signup data
const validateSignup = async (req, res, next) => {
  const { email, password, phone, country, accountType, termsAccepted } = req.body;
  const errors = [];

  // Required fields
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!phone) errors.push('Phone number is required');
  if (!country) errors.push('Country is required');
  if (!accountType) errors.push('Account type is required');
  if (!termsAccepted) errors.push('You must accept the terms and conditions');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password validation
  if (password) {
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('Password must contain a number');
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.push('Password must contain special character');
  }

  // Phone validation
  if (phone && phone.length < 10) {
    errors.push('Please enter a valid phone number');
  }

  // Check if email already exists
  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push('Email address is already registered');
    }
  }

  // Check account type
  if (accountType && !['Personal', 'Business'].includes(accountType)) {
    errors.push('Invalid account type');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// ✅ Validate OTP
const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  if (!otp) errors.push('OTP is required');
  if (otp && (otp.length !== 6 || !/^\d+$/.test(otp))) {
    errors.push('OTP must be 6 digits');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Export both
module.exports = {
  validateSignup,
  validateOTP
};
