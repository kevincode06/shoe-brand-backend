// Import jsonwebtoken library for creating and signing JWTs
// JWTs (JSON Web Tokens) are used to authenticate users without storing session data on the server
const jwt = require('jsonwebtoken');

// Utility function to generate a JWT token for an authenticated user
// Takes a user object and returns a signed token containing essential user data
const generateToken = (user) => {
  return jwt.sign(
    {
      // Payload: Information encoded into the token
      // Only include essential, non-sensitive fields
      id: user._id,         // Unique user ID (used for identifying the user)
      role: user.role,      // Role of the user (e.g., 'brand_user', 'super_admin')
      brand: user.brand,    // Associated brand (only applicable for brand users)
      name: user.name,      // User's display name (optional convenience for frontend)
      email: user.email     // Email address (used for UI or verification)
    },
    // Secret key used to sign the token
    // This should be a long, random string stored in an environment variable
    process.env.JWT_SECRET,

    // Token configuration options
    {
      expiresIn: process.env.JWT_EXPIRE // Defines how long the token is valid (e.g., '1d', '24h', '3600s')
    }
  );
};

// Export the generateToken function to be reused in login and registration logic
module.exports = generateToken;
