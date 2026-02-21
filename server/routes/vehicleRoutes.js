// server/routes/vehicleRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  addVehicle,
  getVehicles,
  updateVehicleStatus,
  deleteVehicle,
} = require("../controllers/vehicleController");

router.get("/", verifyToken, getVehicles);
router.post("/", verifyToken, requireRole("Manager"), addVehicle);
router.put("/:id/status", verifyToken, requireRole("Manager", "Dispatcher"), updateVehicleStatus);
router.delete("/:id", verifyToken, requireRole("Manager"), deleteVehicle);

module.exports = router;