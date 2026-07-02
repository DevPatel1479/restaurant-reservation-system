import { ApiError } from '../utils/apiError.js';

export const notFound = (_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details ?? undefined
  });
};
