const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['Personal', 'Business'],
    required: true
  },
  referralCode: {
    type: String,
    trim: true
  },
  
  // Verification Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isKYCComplete: {
    type: Boolean,
    default: false
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'closed'],
    default: 'pending_verification'
  },
  
  // OTP Fields
  emailOTP: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  
  // Preferences
  otpMethod: {
    type: String,
    enum: ['email', 'phone'],
    default: 'email'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);