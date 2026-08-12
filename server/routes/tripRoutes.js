// server/routes/tripRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  createTrip,
  getTrips,
  getActiveTrips,
  getScheduledTrips,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getDriverTrips,
} = require("../controllers/tripController");

router.get("/", verifyToken, getTrips);
router.get("/active", verifyToken, getActiveTrips);
router.get("/scheduled", verifyToken, getScheduledTrips);
router.get("/driver/:driverId", verifyToken, getDriverTrips);
router.post("/", verifyToken, requireRole("Manager", "Dispatcher"), createTrip);
router.put("/:id/dispatch", verifyToken, requireRole("Manager", "Dispatcher"), dispatchTrip);
router.put("/:id/complete", verifyToken, requireRole("Manager", "Dispatcher"), completeTrip);
router.put("/:id/cancel", verifyToken, requireRole("Manager", "Dispatcher"), cancelTrip);

module.exports = router;