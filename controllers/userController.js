// Import the User model from the models directory to interact with user data in the database
// This model contains user schema definition with fields like name, email, password, role, brand
// Provides methods for user CRUD operations and Mongoose document manipulation
const User = require('../models/User');

// Import bcryptjs for password hashing functionality
// Although not used in current functions, it's imported for consistency and potential future use
// Maintains the same import pattern as auth controller for code consistency
const bcrypt = require('bcryptjs');

// GET /api/users - Retrieve all users from the database (super admin only)
// This endpoint is typically restricted to super admins through middleware authentication
// Used for user management dashboards and administrative oversight
exports.getUsers = async (req, res) => {
  try {
    // Query database for all users with password field excluded from results
    // .select('-password') explicitly excludes the password field for security
    // The minus sign (-) before 'password' means "exclude this field"
    // This prevents sensitive password hashes from being sent to the client
    const users = await User.find().select('-password');
    
    // Return array of users to client
    // 200 status code is default for successful GET requests
    // Frontend can use this data to display user lists, management tables, etc.
    res.json(users);
    
  } catch (error) {
    // Handle any database errors, connection issues, or query failures
    // Common errors: database connection lost, invalid query, memory issues
    console.error('❌ Error fetching users:', error);
    
    // Return generic error message to client
    // 500 Internal Server Error indicates server-side problem
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// DELETE /api/users/:id - Remove a user from the database
// Typically restricted to super admins through middleware authentication
// Permanent deletion - consider implementing soft delete for better data retention
exports.deleteUser = async (req, res) => {
  try {
    // Find the user to be deleted using ID from URL parameters
    // req.params.id comes from the route definition (/api/users/:id)
    // findById() returns the user document or null if not found
    const user = await User.findById(req.params.id);
    
    // Validate that user exists before attempting deletion
    // Early return pattern prevents unnecessary processing and provides clear error
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Permanently delete the user document from the database
    // deleteOne() is the recommended method (remove() is deprecated)
    // This action is irreversible - all user data will be lost
    await user.deleteOne();
    
    // Confirm successful deletion to the client
    // Standard response pattern for successful deletion operations
    res.json({ message: 'User deleted' });
    
  } catch (error) {
    // Handle deletion errors: database issues, constraint violations, etc.
    // Could include foreign key constraints if user has related data
    console.error('❌ Error deleting user:', error);
    
    // Return generic error message to client
    // Avoid exposing internal error details for security reasons
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// PUT/PATCH /api/users/:id - Update user's brand assignment or role
// Allows administrators to modify user permissions and brand associations
// Typically used for user management and role assignment operations
exports.updateUser = async (req, res) => {
  try {
    // Extract fields to be updated from request body
    // Only brand and role are updateable through this endpoint
    // This design pattern separates profile updates from administrative updates
    const { brand, role } = req.body;
    
    // Find the user to be updated by ID from URL parameters
    // Same pattern as delete - first verify the resource exists
    const user = await User.findById(req.params.id);
    
    // Validate user exists before attempting update
    // 404 Not Found is appropriate when the target resource doesn't exist
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update user fields using conditional assignment
    // Logical OR (||) operator provides fallback to current value if new value is falsy
    // This allows partial updates - admin can update just brand or just role
    user.brand = brand || user.brand;   // Update brand if provided, otherwise keep current brand
    user.role = role || user.role;     // Update role if provided, otherwise keep current role

    // Save the updated user document to database
    // This triggers Mongoose validation defined in the User schema
    // Also updates any timestamp fields like 'updatedAt' if they exist
    await user.save();

    // Return the updated user document to client
    // Note: This includes the password field which might be a security concern
    // Consider using .select('-password') or creating a clean user object
    // Frontend can use this to immediately update the UI without refetching
    res.json(user);
    
  } catch (error) {
    // Handle update errors: validation failures, database issues, etc.
    // Mongoose validation errors would be caught here
    console.error('❌ Error updating user:', error);
    
    // Return generic error message to client
    // Consider handling specific error types (validation, cast errors, etc.)
    res.status(500).json({ message: 'Error updating user' });
  }
};

/* 
 * SECURITY CONSIDERATIONS FOR THIS CONTROLLER:
 * 
 * 1. Password Exposure: The updateUser function returns the full user object,
 *    which may include the password hash. Consider excluding sensitive fields.
 * 
 * 2. Authorization: These functions should be protected by middleware that
 *    ensures only super admins can access user management endpoints.
 * 
 * 3. Audit Trail: Consider logging administrative actions for compliance
 *    and security monitoring purposes.
 * 
 * 4. Input Validation: Add validation for role and brand values to ensure
 *    only valid roles/brands can be assigned.
 * 
 * 5. Soft Delete: Consider implementing soft delete instead of hard delete
 *    to maintain data integrity and allow for data recovery.
 * 
 * POTENTIAL IMPROVEMENTS:
 * 
 * 1. Add input validation middleware for role and brand fields
 * 2. Implement audit logging for all administrative actions
 * 3. Add pagination for getUsers when dealing with large user bases
 * 4. Create separate endpoints for different types of user updates
 * 5. Add email notifications for role/brand changes
 * 6. Implement user deactivation instead of deletion
 */