// server/routes/maintenanceRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  logMaintenance,
  getMaintenanceHistory,
  resolveMaintenance,
  deleteMaintenance,
} = require("../controllers/maintenanceController");

router.get("/", verifyToken, getMaintenanceHistory);
router.post("/", verifyToken, requireRole("Manager", "SafetyOfficer"), logMaintenance);
router.put("/:id/resolve", verifyToken, requireRole("Manager", "SafetyOfficer"), resolveMaintenance);
router.delete("/:id", verifyToken, requireRole("Manager"), deleteMaintenance);

module.exports = router;