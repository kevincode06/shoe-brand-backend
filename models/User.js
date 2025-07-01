// Mongoose schema for user documents
// Includes required fields and validations for role-based access control
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },               // Full name
  email: { type: String, required: true, unique: true },// Unique email address
  password: { type: String, required: true },           // Hashed password

  brand: {
    type: String,
    required: function () {
      // Brand is only required for users with role 'brand_user'
      return this.role === 'brand_user';
    },
  },

  role: {
    type: String,
    enum: ['brand_user', 'super_admin'], // Role-based access
    default: 'brand_user',
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('User', userSchema);
