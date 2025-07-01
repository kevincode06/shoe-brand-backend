// Routes for managing users (Super Admin only)
const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, updateUser } = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all routes with auth and super_admin role check
router.use(authMiddleware);
router.use(roleMiddleware(['super_admin']));

// GET /api/users -> Get all users
router.get('/', getUsers);

// DELETE /api/users/:id -> Delete a user by ID
router.delete('/:id', deleteUser);

// PUT /api/users/:id -> Update user by ID
router.put('/:id', updateUser);

module.exports = router;
