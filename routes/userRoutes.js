const express = require('express');
const router = express.Router();

const { getUsers, deleteUser, updateUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Only super admin can access
router.use(authMiddleware);
router.use(roleMiddleware(['super_admin']));

router.get('/', getUsers);
router.delete('/:id', deleteUser);
router.put('/:id', updateUser);

module.exports = router;
