// Middleware to check user role and optionally brand access for certain routes
const roleMiddleware = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
      }
      next();
    };
  };
  
  module.exports = roleMiddleware;
  