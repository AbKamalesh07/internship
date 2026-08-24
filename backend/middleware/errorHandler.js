// Catches errors passed via next(err) from anywhere in the app.
// Must be registered LAST, after all routes, in server.js.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  let message = err.message || "Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Multer upload errors (file too large, too many files, wrong field name)
  if (err.name === "MulterError") {
    statusCode = 400;
    const multerMessages = {
      LIMIT_FILE_SIZE: "One or more files exceed the 5MB size limit",
      LIMIT_FILE_COUNT: "Too many files in this upload",
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: ${err.field}`,
    };
    message = multerMessages[err.code] || err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
