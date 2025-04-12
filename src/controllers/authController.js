const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, name, email, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this username or email',
      });
    }

    // Create new user
    const user = new User({
      username,
      password,
      name,
      email,
      phone,
      role: role || 'customer', // Default role
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Refresh token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

module.exports = {
  register,
  login,
  refresh,
  getCurrentUser,
}; 