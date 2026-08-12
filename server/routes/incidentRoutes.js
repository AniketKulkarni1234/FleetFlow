// server/routes/incidentRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  reportIncident,
  getIncidents,
  updateIncidentStatus,
} = require("../controllers/incidentController");

router.get("/", verifyToken, getIncidents);
router.post("/", verifyToken, requireRole("SafetyOfficer", "Manager"), reportIncident);
router.put("/:id/status", verifyToken, requireRole("SafetyOfficer", "Manager"), updateIncidentStatus);

module.exports = router;
