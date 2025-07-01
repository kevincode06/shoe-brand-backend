// Middleware to authenticate users based on JWT in Authorization header
// This function checks if the request contains a valid token and attaches user info to req.user
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Extract Authorization header from the request
  const authHeader = req.headers.authorization;

  // If header is missing or doesn't start with 'Bearer ', deny access
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract token from 'Bearer <token>' format
  const token = authHeader.split(' ')[1];

  try {
    // Verify and decode the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user info (userId, brand, role) to req.user
    req.user = decoded;

    // Allow request to proceed
    next();
  } catch (error) {
    // If token is invalid or expired, respond with unauthorized error
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
