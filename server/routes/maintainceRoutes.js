// server/routes/maintenanceRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  logMaintenance,
  getMaintenanceHistory,
  deleteMaintenance,
} = require("../controllers/maintainceController");

router.get("/", verifyToken, getMaintenanceHistory);
router.post("/", verifyToken, requireRole("Manager", "SafetyOfficer"), logMaintenance);
router.delete("/:id", verifyToken, requireRole("Manager"), deleteMaintenance);

module.exports = router;