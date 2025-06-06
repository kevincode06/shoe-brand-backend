const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  brand: {
    type: String,
    required: function () {
      return this.role === 'brand_user';
    },
  },
  role: {
    type: String,
    enum: ['brand_user', 'super_admin'],
    default: 'brand_user',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
