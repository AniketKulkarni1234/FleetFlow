// server/routes/driverRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  addDriver,
  getDrivers,
  updateDriverStatus,
  deleteDriver,
} = require("../controllers/driverController");

router.get("/", verifyToken, getDrivers);
router.post("/", verifyToken, requireRole("Manager"), addDriver);
router.put("/:id/status", verifyToken, requireRole("Manager", "Dispatcher"), updateDriverStatus);
router.delete("/:id", verifyToken, requireRole("Manager"), deleteDriver);

module.exports = router;