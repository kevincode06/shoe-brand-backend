const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, brand: user.brand, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register user
exports.register = async (req, res) => {
  const { name, email, password, brand } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      brand,
      role: 'brand_user'  // default role
    });

    const token = generateToken(user);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, brand: user.brand, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, brand: user.brand, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};
