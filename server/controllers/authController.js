import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or HR Admin)
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, position, phone, managerId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isUsingInMemory()) {
      const existingUser = inMemoryDB.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'Employee',
        department: department || 'General',
        position: position || 'Team Member',
        phone: phone || '',
        joiningDate: new Date(),
        status: 'Active',
        managerId: managerId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryDB.users.push(newUser);

      const token = generateToken(newUser._id);
      const { password: _, ...userData } = newUser;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: userData,
      });
    }

    // Mongoose path
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'Employee',
      department: department || 'General',
      position: position || 'Team Member',
      phone: phone || '',
      managerId: managerId || null,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        joiningDate: user.joiningDate,
        status: user.status,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isUsingInMemory()) {
      const user = inMemoryDB.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      if (user.status === 'Inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated. Please contact HR.',
        });
      }

      const token = generateToken(user._id);
      const { password: _, ...userData } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: userData,
      });
    }

    // Mongoose path
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact HR.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        joiningDate: user.joiningDate,
        status: user.status,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error getting user profile',
      error: error.message,
    });
  }
};

// @desc    Logout user / clear session
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};
