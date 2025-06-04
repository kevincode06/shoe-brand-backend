const mongoose = require('mongoose');

const shoeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, enum: ['Nike', 'Adidas', 'Puma'], required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String }, // This will store the image filename
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Shoe', shoeSchema);
