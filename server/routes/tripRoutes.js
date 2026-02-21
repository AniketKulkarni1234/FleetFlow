// server/routes/tripRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  createTrip,
  getTrips,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

router.get("/", verifyToken, getTrips);
router.post("/", verifyToken, requireRole("Manager", "Dispatcher"), createTrip);
router.put("/:id/complete", verifyToken, requireRole("Manager", "Dispatcher"), completeTrip);
router.put("/:id/cancel", verifyToken, requireRole("Manager", "Dispatcher"), cancelTrip);

module.exports = router;