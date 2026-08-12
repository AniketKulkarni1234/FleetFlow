// server/controllers/scheduleController.js
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

/**
 * GET /api/schedule
 * Return all trips scheduled for calendar/timeline view
 */
exports.getSchedule = async (req, res) => {
  try {
    const trips = await Trip.find({
      scheduledDate: { $exists: true, $ne: null }
    })
      .populate("vehicle driver")
      .sort({ scheduledDate: 1 });
    
    res.json(trips);
  } catch (err) {
    console.error("Fetch Schedule Error:", err);
    res.status(500).json({ msg: "Failed to load schedule" });
  }
};

/**
 * POST /api/schedule/auto-dispatch
 * Dispatch all DRAFT scheduled trips whose scheduled date is due (e.g. today or in the past)
 */
exports.autoDispatchScheduled = async (req, res) => {
  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find DRAFT trips scheduled up to the end of today
    const tripsToDispatch = await Trip.find({
      status: "DRAFT",
      scheduledDate: { $lte: todayEnd, $exists: true, $ne: null }
    }).populate("vehicle driver");

    if (tripsToDispatch.length === 0) {
      return res.json({ msg: "No pending scheduled trips require dispatch today.", count: 0 });
    }

    let dispatchedCount = 0;
    const errors = [];

    for (let trip of tripsToDispatch) {
      // Validate feasibility
      if (trip.vehicle.status !== "AVAILABLE") {
        errors.push(`Trip TRP-${trip._id.toString().slice(-6).toUpperCase()}: Vehicle ${trip.vehicle.name} is ${trip.vehicle.status}`);
        continue;
      }
      if (trip.driver.status !== "AVAILABLE") {
        errors.push(`Trip TRP-${trip._id.toString().slice(-6).toUpperCase()}: Driver ${trip.driver.name} is ${trip.driver.status}`);
        continue;
      }

      // Mark resources as active
      trip.vehicle.status = "ON_TRIP";
      trip.driver.status = "ON_TRIP";
      await trip.vehicle.save();
      await trip.driver.save();

      // Dispatch trip
      trip.status = "DISPATCHED";
      trip.actualDepartureTime = new Date();
      await trip.save();
      dispatchedCount++;
    }

    res.json({
      msg: `Automated dispatch run complete. Dispatched ${dispatchedCount} trips.`,
      dispatchedCount,
      failures: errors
    });
  } catch (err) {
    console.error("Auto Dispatch Error:", err);
    res.status(500).json({ msg: "Automatic dispatch job failed" });
  }
};

/**
 * POST /api/schedule/check-conflicts
 * Verify if vehicle or driver has any scheduling conflicts (trips scheduled on the same date)
 */
exports.checkConflicts = async (req, res) => {
  try {
    const { vehicleId, driverId, scheduledDate, tripId } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ msg: "Scheduled date is required" });
    }

    const checkDate = new Date(scheduledDate);
    const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999));

    const query = {
      status: { $in: ["DRAFT", "DISPATCHED"] },
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    };

    if (tripId) {
      query._id = { $ne: tripId }; // Exclude current trip if updating
    }

    const conflicts = [];

    if (vehicleId) {
      const vehicleTripConflict = await Trip.findOne({ ...query, vehicle: vehicleId }).populate("vehicle");
      if (vehicleTripConflict) {
        conflicts.push(`Vehicle ${vehicleTripConflict.vehicle.name} is already assigned to a trip on this day.`);
      }
    }

    if (driverId) {
      const driverTripConflict = await Trip.findOne({ ...query, driver: driverId }).populate("driver");
      if (driverTripConflict) {
        conflicts.push(`Driver ${driverTripConflict.driver.name} is already assigned to a trip on this day.`);
      }
    }

    res.json({
      hasConflict: conflicts.length > 0,
      conflicts
    });
  } catch (err) {
    console.error("Conflict checking error:", err);
    res.status(500).json({ msg: "Failed to evaluate schedule conflicts" });
  }
};
