// server/middleware/errorHandler.js

// 404 handler for unmatched API routes
const notFoundHandler = (req, res, next) => {
  res.status(404).json({ msg: "API endpoint not found" });
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    msg:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
};

module.exports = { notFoundHandler, globalErrorHandler };
