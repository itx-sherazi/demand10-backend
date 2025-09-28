// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes
  console.error('Global Error Handler:', err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Set default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Always return JSON response
  res.status(statusCode).json({
    ok: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? message : 'Internal server error'
  });
};

export default errorHandler;