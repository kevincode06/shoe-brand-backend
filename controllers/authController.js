// Import the User model from the models directory to interact with user data in the database
// This model defines the structure of user documents and provides methods for database operations
// Typically includes fields like name, email, password, role, brand, timestamps, etc.
const User = require('../models/User');

// Import bcryptjs library for secure password hashing and comparison
// bcrypt is specifically designed for password hashing with built-in salt generation
// It's intentionally slow to prevent brute force attacks and rainbow table attacks
const bcrypt = require('bcryptjs');

// Import jsonwebtoken library for creating and verifying JWT (JSON Web Token) tokens
// JWTs are used for stateless authentication - no need to store sessions on server
// Token contains encoded user information and expiration time
const jwt = require('jsonwebtoken');

// Utility function to generate a JWT token for authenticated users
// This centralizes token creation logic and ensures consistent token structure
const generateToken = (user) => {
  // Create and return a JWT token with user information as payload
  // JWT structure: header.payload.signature (all base64 encoded)
  return jwt.sign(
    // Payload: data to be encoded in the token (user ID, brand, and role)
    // This data will be available in req.user after token verification
    // Include minimal necessary data to keep token size small
    { userId: user._id, brand: user.brand, role: user.role },
    
    // Secret key from environment variables used to sign the token
    // This secret must be kept secure and should be a long, random string
    // Same secret is used to verify tokens later in authentication middleware
    process.env.JWT_SECRET,
    
    // Token options: configuration for the JWT
    { expiresIn: process.env.JWT_EXPIRE || '1d' } // Token expiration time
    // '1d' = 1 day, could also be '24h', '1440m', or number of seconds
    // After expiration, token becomes invalid and user must re-authenticate
  );
}

// User registration endpoint handler - handles POST requests to create new user accounts
// Exports makes this function available to be imported in route files
exports.register = async (req, res) => {
  // Destructure required fields from request body sent by frontend
  // ES6 destructuring with default value assignment for role
  // If role is not provided in request, it defaults to 'brand_user'
  const { name, email, password, brand, role = 'brand_user' } = req.body;

  try {
    // Log the incoming registration data for debugging purposes
    // Useful for troubleshooting API calls during development
    // In production, be careful not to log sensitive data like passwords
    console.log('📥 Register payload:', req.body);

    // Input validation: check that required fields are present and not empty
    // Frontend validation exists but backend must also validate for security
    // Prevents database errors and provides clear error messages
    if (!name || !email || !password) {
      // Return 400 Bad Request status with descriptive error message
      // Early return prevents further execution of the function
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Business logic validation: brand users must specify which brand they represent
    // This enforces the application's business rules at the API level
    if (role === 'brand_user' && !brand) {
      return res.status(400).json({ message: 'Brand is required for brand users.' });
    }

    // Check if a user with this email already exists in the database
    // Email should be unique across all users to prevent conflicts
    // Using findOne() which returns null if no document is found
    const existingUser = await User.findOne({ email });
    
    // If user exists, return error to prevent duplicate accounts
    // Using same 400 status code to maintain consistency
    if (existingUser) return res.status(400).json({ message: 'Email already exists.' });

    // Hash the password with bcrypt using salt rounds of 10 for security
    // Salt rounds = 10 means 2^10 = 1024 iterations (good balance of security vs performance)
    // Higher numbers = more secure but slower; lower numbers = faster but less secure
    // bcrypt automatically generates a unique salt for each password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object with the provided data
    // Using Mongoose model constructor - this creates a document in memory
    const newUser = new User({
      name,                    // User's full name for display purposes
      email,                   // User's email address (used for login)
      password: hashedPassword, // Hashed password for security (never store plain text passwords)
      role,                    // User's role in the system (admin, brand_user, etc.)
      
      // Conditional field assignment: only set brand field if user is a brand_user
      // This prevents non-brand users from having unnecessary brand data
      // undefined fields are not stored in MongoDB
      brand: role === 'brand_user' ? brand : undefined,
    });

    // Save the new user to the database
    // This triggers Mongoose validations and creates the document in MongoDB
    // Returns the saved document with generated _id and timestamps
    const savedUser = await newUser.save();
    
    // Generate a JWT token for the newly registered user
    // This allows immediate login after registration (better UX)
    const token = generateToken(savedUser);

    // Send success response with user data (excluding password) and token
    // 201 status code indicates successful resource creation
    res.status(201).json({
      // User object for frontend to display user information
      user: {
        id: savedUser._id,      // User's unique database ID (converted from ObjectId)
        name: savedUser.name,   // User's display name
        email: savedUser.email, // User's email address
        brand: savedUser.brand, // User's brand (null/undefined for non-brand users)
        role: savedUser.role,   // User's role for permission checking
      },
      token, // JWT token for immediate authentication in subsequent requests
    });
    
  } catch (error) {
    // Catch any errors that occur during registration process
    // This includes database errors, validation errors, or network issues
    
    // Log detailed error information for debugging
    // error.stack provides full stack trace for debugging
    // In production, consider using a proper logging service
    console.error('❌ Registration error:', error.stack || error);
    
    // Return generic server error message to client
    // Don't expose internal error details to prevent information leakage
    // 500 status code indicates internal server error
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// User login endpoint handler - handles POST requests for user authentication
// This function validates credentials and returns a JWT token for successful logins
exports.login = async (req, res) => {
  // Extract email and password from request body
  // Only these two fields are needed for authentication
  const { email, password } = req.body;

  try {
    // Log the incoming login data for debugging purposes
    // Helps track login attempts and troubleshoot authentication issues
    // Note: In production, avoid logging passwords even in encrypted form
    console.log('🔑 Login payload:', req.body);

    // Find user in database by email address
    // Email is used as the unique identifier for login
    // Returns null if no user found with this email
    const user = await User.findOne({ email });
    
    // If no user found, return error with generic message
    // Generic message prevents attackers from knowing if email exists
    // This is a security best practice to prevent user enumeration
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    // Compare provided password with hashed password stored in database
    // bcrypt.compare() handles the hashing and comparison automatically
    // Returns true if passwords match, false otherwise
    const isMatch = await bcrypt.compare(password, user.password);
    
    // If passwords don't match, return error with same generic message
    // Using same message for both "user not found" and "wrong password"
    // This prevents attackers from distinguishing between the two cases
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    // Generate JWT token for the authenticated user
    // Token will be used for subsequent authenticated requests
    // Contains user information for authorization decisions
    const token = generateToken(user);

    // Send success response with user data (excluding password) and token
    // 200 status code indicates successful authentication
    res.json({
      // User object for frontend to store user information
      user: {
        id: user._id,      // User's unique database ID
        name: user.name,   // User's display name
        email: user.email, // User's email address
        brand: user.brand, // User's brand (may be null for non-brand users)
        role: user.role,   // User's role for permission-based access control
      },
      token, // JWT token for authorization in future requests
             // Frontend should store this token (in localStorage, sessionStorage, or cookie)
             // and include it in Authorization header for protected routes
    });
    
  } catch (error) {
    // Catch any errors that occur during login process
    // This includes database connection errors, bcrypt errors, or other exceptions
    
    // Log detailed error information for debugging and monitoring
    // Include stack trace for better error tracking
    console.error('❌ Login error:', error.stack || error);
    
    // Return generic server error message to client
    // Don't expose internal error details for security reasons
    // 500 status code indicates internal server error
    res.status(500).json({ message: 'Server error during login' });
  }
};