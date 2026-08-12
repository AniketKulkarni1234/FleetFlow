// server/routes/routeRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  estimateRoute,
  suggestVehicle,
  getRouteHistory,
  getCities,
} = require("../controllers/routeController");

router.get("/cities", verifyToken, getCities);
router.get("/history", verifyToken, getRouteHistory);
router.post("/estimate", verifyToken, requireRole("Manager", "Dispatcher"), estimateRoute);
router.post("/suggest-vehicle", verifyToken, requireRole("Manager", "Dispatcher"), suggestVehicle);

module.exports = router;
