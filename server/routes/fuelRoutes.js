// server/routes/fuelRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { createFuelEntry, getFuelEntries, getFuelAnalytics } = require("../controllers/fuelController");

router.get("/", verifyToken, getFuelEntries);
router.get("/analytics", verifyToken, getFuelAnalytics);
router.post("/", verifyToken, requireRole("Manager", "Dispatcher"), createFuelEntry);

module.exports = router;
