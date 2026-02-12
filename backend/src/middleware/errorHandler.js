// backend/src/middleware/errorHandler.js

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * This catches all errors and sends consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size too large (maximum 50MB)';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique constraint violation
    statusCode = 409;
    message = 'Resource already exists (duplicate entry)';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = 404;
    message = 'Referenced resource not found';
  }

  if (err.code === '23502') { // Not null violation
    statusCode = 400;
    message = 'Required field is missing';
  }

  if (err.code === '22P02') { // Invalid text representation
    statusCode = 400;
    message = 'Invalid data format';
  }

  // AWS S3 errors
  if (err.name === 'NoSuchBucket') {
    statusCode = 500;
    message = 'S3 bucket not found - configuration error';
  }

  if (err.name === 'InvalidAccessKeyId' || err.name === 'SignatureDoesNotMatch') {
    statusCode = 500;
    message = 'AWS credentials invalid - configuration error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details || null,
      }),
    },
    metadata: {
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { 
  errorHandler, 
  AppError, 
  asyncHandler 
};