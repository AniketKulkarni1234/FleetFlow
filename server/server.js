// server/server.js
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const { setupTelemetry } = require("./utils/telemetryHelper");
const { authLimiter } = require("./middleware/rateLimiter");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Routes
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const routeRoutes = require("./routes/routeRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const searchRoutes = require("./routes/searchRoutes");
const fuelRoutes = require("./routes/fuelRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: "10kb" })); // Limit body size for security

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/leaves", leaveRequestRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/finance", financeRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("FleetFlow API is running 🚀");
});

// 404 & Error Handling Middlewares
app.use("/api/*", notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP server and attach Socket.IO
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Connect MongoDB FIRST, then start server + telemetry engine
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log("MongoDB connected ✅");
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚚`);
    setupTelemetry(io);
  });
})
.catch((err) => {
  console.log("MongoDB connection error ❌", err.message);
  process.exit(1);
});