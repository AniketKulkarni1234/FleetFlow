// server/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { 
  getAnalyticsReport,
  getDeliveryPerformance,
  getDriverPerformance,
  getFleetUtilizationTrend 
} = require("../controllers/analyticsController");

// Get consolidated analytics report
router.get("/", verifyToken, getAnalyticsReport);
router.get("/delivery-performance", verifyToken, getDeliveryPerformance);
router.get("/driver-performance", verifyToken, getDriverPerformance);
router.get("/utilization-trend", verifyToken, getFleetUtilizationTrend);

module.exports = router;