import { ApiError } from '../utils/apiError.js';

export const validate = (schema, property = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[property]);
  if (!result.success) {
    return next(
      new ApiError(400, 'Validation failed', result.error.flatten())
    );
  }
  req[property] = result.data;
  return next();
};
