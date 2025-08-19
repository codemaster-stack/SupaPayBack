const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connect = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();

// Connect to Database
connect();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://supapay.netlify.app', // Replace with your actual frontend URL
        
      ] 
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:5500', 
        'http://localhost:5500',
        'http://localhost:8080'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Handle preflight requests
app.options('*', cors());

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SupaPay API is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SupaPay API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

app.set('trust proxy', true)
// API Routes
app.use('/api/auth', authRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`,
    error: 'NOT_FOUND',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/auth/signup',
      'POST /api/auth/verify-otp',
      'POST /api/auth/resend-otp'
    ]
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : 'SERVER_ERROR'
  });
});


// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  const baseURL = process.env.NODE_ENV === 'production' 
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'https://supapayback.onrender.com'}`
    : `http://localhost:${PORT}`;
    
  console.log(`
  🚀 SupaPay Server is running!
  📍 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 Health Check: ${baseURL}/health
  📧 Auth API: ${baseURL}/api/auth
  `);
});

// Graceful shutdown for Render
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED PROMISE REJECTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = app;

