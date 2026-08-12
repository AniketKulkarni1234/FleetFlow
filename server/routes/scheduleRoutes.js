// server/routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  getSchedule,
  autoDispatchScheduled,
  checkConflicts,
} = require("../controllers/scheduleController");

router.get("/", verifyToken, getSchedule);
router.post("/auto-dispatch", verifyToken, requireRole("Manager", "Dispatcher"), autoDispatchScheduled);
router.post("/check-conflicts", verifyToken, requireRole("Manager", "Dispatcher"), checkConflicts);

module.exports = router;
