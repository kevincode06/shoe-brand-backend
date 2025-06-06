const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, brand: user.brand, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, brand, role = 'brand_user' } = req.body;

  try {
    console.log('📥 Register payload:', req.body);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (role === 'brand_user' && !brand) {
      return res.status(400).json({ message: 'Brand is required for brand users.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      brand: role === 'brand_user' ? brand : undefined,
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser);

    res.status(201).json({
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        brand: savedUser.brand,
        role: savedUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Registration error:', error.stack || error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('🔑 Login payload:', req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = generateToken(user);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        brand: user.brand,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Login error:', error.stack || error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
