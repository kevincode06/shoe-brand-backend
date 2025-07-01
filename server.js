// Load environment variables from .env file into process.env
// This allows us to store sensitive data like database URLs, API keys, and passwords
// in a separate .env file instead of hardcoding them in our source code
require('dotenv').config();

// Import required npm packages that provide core functionality
const express = require('express');     // Fast, unopinionated web framework for Node.js - handles HTTP requests/responses
const mongoose = require('mongoose');   // Elegant MongoDB object modeling library with built-in type casting, validation, query building
const cors = require('cors');          // Middleware to enable Cross-Origin Resource Sharing - allows frontend to talk to backend

// Import custom route modules from separate files for better code organization
// Each route file contains related API endpoints grouped by functionality
const authRoutes = require('./routes/authRoutes');   // Handles user authentication: login, register, logout, password reset
const shoeRoutes = require('./routes/shoeRoutes');   // Handles shoe inventory: create, read, update, delete shoes
const userRoutes = require('./routes/userRoutes');   // Handles user management: profile updates, user lists, permissions

// Create Express application instance - this is the main server object
// Express app provides methods to define routes, configure middleware, and start the server
const app = express();

// Whitelist of domains allowed to make requests to this API server
// CORS security feature prevents unauthorized websites from accessing our API
// Only these specific origins can send requests from a browser to our backend
const allowedOrigins = [
  'https://shoe-brand-frontend.vercel.app',  // Production frontend deployed on Vercel
  'http://localhost:3000',                   // Local React development server (Create React App default port)
  'http://localhost:5000'                    // Alternative local development port or Node.js server
];

// Configure CORS (Cross-Origin Resource Sharing) middleware
// CORS is a security feature that blocks web pages from making requests to a different domain
// We need to explicitly allow our frontend domains to communicate with this backend
app.use(cors({
  // Custom origin function to dynamically check each incoming request's origin
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, mobile apps, Postman, curl)
    // These requests don't have an Origin header and are generally safe
    if (!origin) return callback(null, true);
    
    // Check if the requesting domain is in our approved whitelist
    if (allowedOrigins.indexOf(origin) === -1) {
      // Origin not found in whitelist - reject the request with error message
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);  // First param is error, second is whether to allow
    }
    // Origin is approved - allow the request to proceed
    return callback(null, true);  // null = no error, true = allow request
  },
  credentials: true,  // Allow cookies, authorization headers, and TLS client certificates in requests
                     // Required for sessions, JWT tokens in cookies, and authenticated requests
}));

// Built-in Express middleware to parse incoming JSON request bodies
// Converts JSON strings in request bodies to JavaScript objects accessible via req.body
// Without this, req.body would be undefined for JSON requests
// Automatically adds Content-Type: application/json header support
app.use(express.json());

// API health check endpoint - useful for monitoring and debugging
// Returns server status, timestamp, and environment info in JSON format
// Helps developers and monitoring tools verify the API is running correctly
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Shoe Brand API is running!',
    timestamp: new Date().toISOString(),        // ISO 8601 formatted current date/time
    environment: process.env.NODE_ENV || 'development'  // Shows if running in dev, staging, or production
  });
});

// Root endpoint (homepage) - basic server identification
// Provides basic information about the server and API entry point
// Useful for anyone accessing the server URL directly in a browser
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shoe Brand Backend Server',
    status: 'active',
    apiEndpoint: '/api'  // Tells clients where to find the actual API endpoints
  });
});

// Establish connection to MongoDB database using Mongoose ODM
// MONGO_URI should be in .env file (e.g., mongodb://localhost:27017/shoestore or MongoDB Atlas URL)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,    // Use new URL string parser to avoid deprecation warnings
  useUnifiedTopology: true, // Use new Server Discover and Monitoring engine for better connection handling
})
  .then(() => console.log(' MongoDB connected'))           // Promise resolves on successful connection
  .catch((err) => console.error(' MongoDB connection error:', err));  // Promise rejects on connection failure

// Mount route handlers at specific URL paths (route prefixes)
// All routes defined in these files will be prefixed with the specified path
// Example: if authRoutes has a '/login' route, the full path becomes '/api/auth/login'
app.use('/api/auth', authRoutes);   // Authentication routes: /api/auth/login, /api/auth/register, etc.
app.use('/api/shoes', shoeRoutes);  // Shoe management routes: /api/shoes, /api/shoes/:id, etc.
app.use('/api/users', userRoutes);  // User management routes: /api/users, /api/users/:id, etc.

// Global error handling middleware - must be defined after all routes
// Express automatically calls this when any route throws an error or calls next(error)
// The 4 parameters (err, req, res, next) identify this as an error handling middleware
app.use((err, req, res, next) => {
  console.error(' Error:', err.message);  // Log the error details to console for debugging
  res.status(500).json({ 
    error: 'Something went wrong!',           // Generic user-friendly error message
    message: err.message                      // Specific error details (be careful not to expose sensitive info)
  });
});

// Catch-all 404 handler for any routes that don't match above patterns
// The '*' wildcard matches any path that hasn't been handled by previous routes
// Must be placed after all other routes to act as a fallback
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    requestedPath: req.originalUrl  // Shows exactly what URL was requested for debugging
  });
});

// Start the HTTP server and listen for incoming requests
const PORT = process.env.PORT || 5000;  // Use PORT from environment variables (required for deployment platforms like Heroku)
                                        // Falls back to 5000 if no PORT environment variable is set
app.listen(PORT, () => {
  // Server startup success callback - logs important information to console
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Export the Express app instance for use in other files
// Commonly used for testing (importing app in test files) or when using this server as a module
// Allows other files to import this app with: const app = require('./server.js')
module.exports = app;