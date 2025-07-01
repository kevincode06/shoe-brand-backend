// Import the Shoe model from the models directory to interact with shoe data in the database
// This model defines the structure of shoe documents including fields like name, price, description, brand
// Provides methods for CRUD operations and Mongoose schema validation
const Shoe = require('../models/Shoe');

// GET /api/shoes - Retrieve shoes based on user role and permissions
// Brand users see only their brand's shoes, super admins see all shoes
// This implements role-based access control (RBAC) at the data level
exports.getShoes = async (req, res) => {
  try {
    // Build MongoDB query based on user's role and permissions
    // Ternary operator: condition ? valueIfTrue : valueIfFalse
    const query = req.user.role === 'super_admin' 
      ? {}                        // Empty query = get all shoes (no filter)
      : { brand: req.user.brand }; // Filtered query = get only shoes matching user's brand

    // Execute the query to find shoes matching the criteria
    // Mongoose find() returns an array of documents that match the query
    // If no documents match, returns empty array []
    const shoes = await Shoe.find(query);
    
    // Send successful response with shoes data
    // 200 status code is default for successful GET requests
    res.json(shoes);
    
  } catch (error) {
    // Catch any database errors, network issues, or other exceptions
    // Log error details for debugging (consider using proper logging service in production)
    console.error('❌ Error fetching shoes:', error);
    
    // Return generic error message to client
    // 500 status code indicates internal server error
    res.status(500).json({ message: 'Error fetching shoes' });
  }
};

// POST /api/shoes - Create a new shoe with role-based brand validation
// Ensures brand users can only create shoes for their own brand
// Super admins can create shoes for any brand
exports.createShoe = async (req, res) => {
  try {
    // Extract shoe data from request body sent by frontend
    // Destructuring assignment makes code cleaner and more readable
    const { name, price, description, brand } = req.body;

    // Authorization check: Brand users can only create shoes for their own brand
    // This prevents brand users from creating shoes for competitor brands
    // Super admins bypass this check (they can create for any brand)
    if (req.user.role === 'brand_user' && brand !== req.user.brand) {
      // 403 Forbidden status indicates user lacks permission for this action
      // Different from 401 Unauthorized (which means not authenticated)
      return res.status(403).json({ message: 'Cannot create shoe for another brand' });
    }

    // Create new shoe document in database using Mongoose create() method
    // create() is shorthand for: new Shoe({...}).save()
    // Automatically handles validation defined in the Shoe schema
    const shoe = await Shoe.create({ 
      name,        // Shoe name/title
      price,       // Shoe price (typically a number)
      description, // Detailed description of the shoe
      brand        // Brand name (must match user's brand for brand_users)
    });
    
    // Send successful creation response with the new shoe data
    // 201 status code specifically indicates successful resource creation
    res.status(201).json(shoe);
    
  } catch (error) {
    // Handle various types of errors that can occur during shoe creation
    // Could be validation errors, database connection issues, etc.
    console.error('❌ Error creating shoe:', error);
    
    // Return generic error message to client
    // In production, you might want to handle specific error types differently
    res.status(500).json({ message: 'Error creating shoe' });
  }
};

// PUT/PATCH /api/shoes/:id - Update an existing shoe with authorization checks
// Implements both resource existence validation and role-based access control
exports.updateShoe = async (req, res) => {
  try {
    // First, find the shoe to be updated by its ID from URL parameters
    // req.params.id comes from the route parameter (/api/shoes/:id)
    // findById() returns null if no document with that ID exists
    const shoe = await Shoe.findById(req.params.id);
    
    // Check if shoe exists in database
    // Early return pattern prevents deeply nested code
    if (!shoe) return res.status(404).json({ message: 'Shoe not found' });

    // Authorization check: Brand users can only update shoes from their own brand
    // This prevents unauthorized modification of competitor's shoes
    // Super admins can update any shoe regardless of brand
    if (req.user.role === 'brand_user' && shoe.brand !== req.user.brand) {
      // 403 Forbidden indicates user doesn't have permission to modify this resource
      return res.status(403).json({ message: 'Not authorized to update this shoe' });
    }

    // Extract updated data from request body
    // Client can send partial updates (only fields they want to change)
    const { name, price, description, brand } = req.body;

    // Additional authorization check: Brand users cannot change shoe's brand
    // This prevents brand users from "stealing" shoes by changing their brand
    // The 'brand &&' check ensures we only validate if brand is being updated
    if (req.user.role === 'brand_user' && brand && brand !== req.user.brand) {
      return res.status(403).json({ message: 'Cannot change shoe brand to another brand' });
    }

    // Update shoe fields using conditional assignment (only update if new value provided)
    // Logical OR operator (||) provides fallback to current value if new value is falsy
    // This allows partial updates - client can send only the fields they want to change
    shoe.name = name || shoe.name;                   // Update name if provided, otherwise keep current
    shoe.price = price || shoe.price;               // Update price if provided, otherwise keep current
    shoe.description = description || shoe.description; // Update description if provided, otherwise keep current
    shoe.brand = brand || shoe.brand;               // Update brand if provided, otherwise keep current

    // Save the updated shoe to database
    // This triggers Mongoose validation and updates the document
    // Also updates the 'updatedAt' timestamp if it exists in schema
    await shoe.save();
    
    // Return the updated shoe data to client
    // Allows frontend to immediately display the updated information
    res.json(shoe);
    
  } catch (error) {
    // Handle various errors: database issues, validation failures, etc.
    console.error('❌ Error updating shoe:', error);
    
    // Return generic error message
    // Consider handling specific error types (validation, cast errors, etc.)
    res.status(500).json({ message: 'Error updating shoe' });
  }
};

// DELETE /api/shoes/:id - Remove a shoe from the database with authorization
// Implements soft delete prevention - only authorized users can delete shoes
exports.deleteShoe = async (req, res) => {
  try {
    // Find the shoe to be deleted by ID from URL parameters
    // Same pattern as update - first check if resource exists
    const shoe = await Shoe.findById(req.params.id);
    
    // Validate that shoe exists before attempting deletion
    // 404 Not Found is appropriate when resource doesn't exist
    if (!shoe) return res.status(404).json({ message: 'Shoe not found' });

    // Authorization check: Brand users can only delete their own brand's shoes
    // This prevents accidental or malicious deletion of competitor's products
    // Super admins have full deletion privileges
    if (req.user.role === 'brand_user' && shoe.brand !== req.user.brand) {
      // 403 Forbidden indicates user lacks permission to delete this resource
      return res.status(403).json({ message: 'Not authorized to delete this shoe' });
    }

    // Delete the shoe from database
    // deleteOne() is preferred over remove() (which is deprecated)
    // This permanently removes the document from the collection
    await shoe.deleteOne();
    
    // Confirm successful deletion to client
    // 200 status with confirmation message is standard for successful deletion
    res.json({ message: 'Shoe deleted' });
    
  } catch (error) {
    // Handle deletion errors: database issues, constraint violations, etc.
    console.error('❌ Error deleting shoe:', error);
    
    // Return generic error message to client
    // In production, might want to handle specific error scenarios
    res.status(500).json({ message: 'Error deleting shoe' });
  }
};