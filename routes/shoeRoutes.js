// Routes for CRUD operations on shoes
const express = require('express');
const router = express.Router();
const { getShoes, createShoe, updateShoe, deleteShoe } = require('../controllers/shoeController');

// Middleware to protect all routes
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);

// GET /api/shoes -> Get all shoes
router.get('/', getShoes);

// POST /api/shoes/create -> Add a new shoe
router.post('/create', createShoe);

// PUT /api/shoes/:id -> Update a shoe by ID
router.put('/:id', updateShoe);

// DELETE /api/shoes/:id -> Delete a shoe by ID
router.delete('/:id', deleteShoe);

module.exports = router;
