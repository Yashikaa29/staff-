import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2026';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isUsingInMemory()) {
      const user = inMemoryDB.users.find(
        (u) => u._id.toString() === decoded.id.toString()
      );
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or token expired',
      error: err.message,
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this route. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};
