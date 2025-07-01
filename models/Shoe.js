// Mongoose schema for shoe documents
// Defines structure of shoe items stored in MongoDB
const mongoose = require('mongoose');

const shoeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name of the shoe
  brand: { type: String, enum: ['Nike', 'Adidas', 'Puma'], required: true }, // Predefined brands
  price: { type: Number, required: true }, // Price in your local currency
  description: { type: String },           // Optional: shoe details
  image: { type: String },                 // Filename of uploaded image
  createdAt: { type: Date, default: Date.now } // Timestamp
});

module.exports = mongoose.model('Shoe', shoeSchema);
