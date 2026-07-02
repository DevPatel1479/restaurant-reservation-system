import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

const signToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      throw new ApiError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: 'customer' });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: sanitizeUser(user), token }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });


    if (!user) throw new ApiError(401, 'Invalid credentials');


    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) throw new ApiError(401, 'Invalid credentials');

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: sanitizeUser(user), token }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
