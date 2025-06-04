const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  brand: { type: String, enum: ['Nike', 'Adidas', 'Puma'], required: true },
  role: { type: String, enum: ['brand_user', 'super_admin'], default: 'brand_user' }
});

module.exports = mongoose.model('User', userSchema);
