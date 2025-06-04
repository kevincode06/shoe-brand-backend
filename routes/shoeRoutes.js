const express = require('express');
const router = express.Router();

const { getShoes, createShoe, updateShoe, deleteShoe } = require('../controllers/shoeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getShoes);
router.post('/create', createShoe);
router.put('/:id', updateShoe);
router.delete('/:id', deleteShoe);

module.exports = router;
