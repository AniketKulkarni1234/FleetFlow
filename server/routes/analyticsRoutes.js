// server/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { calculateFuelEfficiency, calculateVehicleROI } = require("../controllers/analyticsController");

router.get("/fuel", verifyToken, calculateFuelEfficiency);
router.get("/roi", verifyToken, calculateVehicleROI);

module.exports = router;