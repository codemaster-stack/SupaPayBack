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
  enum: ['personal', 'business'],
  required: true
},

nationality: {
  type: String,
  enum: ['nigeria', 'uk', 'us', 'canada', 'other']
},
industry: {
  type: String,
  enum: ['technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'other']
},

  referralCode: {
    type: String,
    trim: true
  },
  
termsAccepted: {
  type: Boolean,
  required: true
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
  

// Update existing kycStatus to include 'not_started'
kycStatus: {
  type: String,
  enum: ['not_started', 'pending', 'approved', 'declined'],
  default: 'not_started'
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


  // KYC Data Fields
kycData: {
  // Personal Information (both business and individual)
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    nationality: String,
    address: String
  },
  
  // Business Information (business accounts only)
  businessInfo: {
    companyName: String,
    registrationNumber: String,
    industry: String,
    countryOfIncorporation: String,
    businessAddress: String
  },
  
  // Directors/Controllers (business accounts only)
  directors: [{
    fullName: String,
    position: String,
    email: String,
    nationality: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Shareholders (business accounts only)
  shareholders: [{
    name: String,
    ownershipPercentage: Number,
    shareholderType: String,
    countryOfResidence: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Individual KYC specific
  individualVerification: {
    verificationMethod: {
      type: String,
      enum: ['drivers-license', 'passport', 'national-id', 'bvn']
    },
    bvnNumber: String,
    bvnPhone: String,
    addressDocumentType: {
      type: String,
      enum: ['utility', 'bank', 'rent', 'government']
    }
  }
},

// Document Storage
kycDocuments: {
  // Individual documents
  identityDocumentFront: String,
  identityDocumentBack: String,
  addressProof: String,
  
  // Business documents
  certificateOfIncorporation: String,
  memorandumAndArticles: String,
  taxRegistration: String,
  businessLicense: String,
  
  // Director/Shareholder documents
  directorDocuments: [String],
  shareholderDocuments: [String],
  
  // Document metadata
  uploadedAt: { type: Date, default: Date.now },
  documentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
},

// KYC Status Tracking
kycCompleted: {
  type: Boolean,
  default: false
},

declineReason: String,
kycSubmittedAt: Date,
kycApprovedAt: Date,
kycDeclinedAt: Date,

// Additional tracking
lastLogin: Date,
  
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