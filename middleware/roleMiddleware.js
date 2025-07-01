// Middleware to authorize users based on their role
// Takes a list of allowed roles and compares with req.user.role
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // If user's role is not allowed, deny access
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
    }

    // Otherwise, allow access
    next();
  };
};

module.exports = roleMiddleware;
