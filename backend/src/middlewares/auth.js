import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing authorization token'));
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  return next();
};
