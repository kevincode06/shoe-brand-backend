const Shoe = require('../models/Shoe');

// Get shoes - brand users see only their brand, super admin sees all
exports.getShoes = async (req, res) => {
  try {
    const query = req.user.role === 'super_admin' ? {} : { brand: req.user.brand };
    const shoes = await Shoe.find(query);
    res.json(shoes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shoes' });
  }
};

// Create new shoe
exports.createShoe = async (req, res) => {
  try {
    const { name, price, description, brand } = req.body;

    // Brand users can only create shoes for their brand
    if (req.user.role === 'brand_user' && brand !== req.user.brand) {
      return res.status(403).json({ message: 'Cannot create shoe for another brand' });
    }

    const shoe = await Shoe.create({ name, price, description, brand });
    res.status(201).json(shoe);
  } catch (error) {
    res.status(500).json({ message: 'Error creating shoe' });
  }
};

// Update shoe
exports.updateShoe = async (req, res) => {
  try {
    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return res.status(404).json({ message: 'Shoe not found' });

    // Brand user can only update their brand's shoes
    if (req.user.role === 'brand_user' && shoe.brand !== req.user.brand) {
      return res.status(403).json({ message: 'Not authorized to update this shoe' });
    }

    const { name, price, description, brand } = req.body;

    // Brand user cannot change shoe brand to another brand
    if (req.user.role === 'brand_user' && brand && brand !== req.user.brand) {
      return res.status(403).json({ message: 'Cannot change shoe brand to another brand' });
    }

    shoe.name = name || shoe.name;
    shoe.price = price || shoe.price;
    shoe.description = description || shoe.description;
    shoe.brand = brand || shoe.brand;

    await shoe.save();
    res.json(shoe);
  } catch (error) {
    res.status(500).json({ message: 'Error updating shoe' });
  }
};

// Delete shoe
exports.deleteShoe = async (req, res) => {
  try {
    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return res.status(404).json({ message: 'Shoe not found' });

    // Brand user can only delete their brand's shoes
    if (req.user.role === 'brand_user' && shoe.brand !== req.user.brand) {
      return res.status(403).json({ message: 'Not authorized to delete this shoe' });
    }

    await shoe.deleteOne();
    res.json({ message: 'Shoe deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shoe' });
  }
};
