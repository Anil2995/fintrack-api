// AppError lets you throw from anywhere in the codebase with an HTTP status baked in.
// The `isOperational` flag helps distinguish user-facing errors from actual crashes
// (useful if you ever add monitoring like Sentry).
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Central error handler — catches everything that's passed to next(err)
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Something went wrong on our end.";

  // Duplicate key (most often an email collision)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message     = `${field} is already registered.`;
    statusCode  = 400;
  }

  // Mongoose schema validations that slipped past express-validator
  if (err.name === "ValidationError") {
    message    = Object.values(err.errors).map(e => e.message).join(". ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message    = "Invalid token. Please log in again.";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message    = "Your session has expired. Please log in again.";
    statusCode = 401;
  }

  // CastError happens when an invalid Mongo ID is passed to findById
  if (err.name === "CastError") {
    message    = `Invalid value for field: ${err.path}`;
    statusCode = 400;
  }

  const payload = { success: false, message };

  // Expose stack trace locally — don't ever leak this in production
  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { AppError, errorHandler };
