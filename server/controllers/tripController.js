// server/controllers/tripController.js
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

exports.createTrip = async (req, res) => {
  const { vehicleId, driverId, cargoWeight, origin, destination, scheduledDate, estimatedDistance, estimatedFuelCost, notes } = req.body;
  try {
    // Input validation
    if (!vehicleId || !driverId || !cargoWeight) {
      return res.status(400).json({ msg: "Vehicle, driver, and cargo weight are required" });
    }
    if (Number(cargoWeight) <= 0) {
      return res.status(400).json({ msg: "Cargo weight must be greater than 0" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });
    if (vehicle.status !== "AVAILABLE") {
      return res.status(400).json({ msg: `Vehicle is currently ${vehicle.status} and cannot be assigned` });
    }
    if (Number(cargoWeight) > vehicle.maxCapacity) {
      return res.status(400).json({ msg: `Cargo exceeds max capacity of ${vehicle.maxCapacity} kg` });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });
    if (driver.status !== "AVAILABLE") {
      return res.status(400).json({ msg: `Driver is currently ${driver.status} and cannot be assigned` });
    }

    // Intercept day-level scheduling conflicts for active trips
    if (scheduledDate) {
      const checkDate = new Date(scheduledDate);
      const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999));

      const conflictQuery = {
        status: { $in: ["DRAFT", "DISPATCHED"] },
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      };

      const vehicleConflict = await Trip.findOne({ ...conflictQuery, vehicle: vehicleId });
      if (vehicleConflict) {
        return res.status(400).json({ msg: "Scheduling Conflict: This vehicle is already assigned to a trip on this day." });
      }

      const driverConflict = await Trip.findOne({ ...conflictQuery, driver: driverId });
      if (driverConflict) {
        return res.status(400).json({ msg: "Scheduling Conflict: This driver is already assigned to a trip on this day." });
      }
    }

    const tripData = {
      vehicle: vehicleId,
      driver: driverId,
      cargoWeight: Number(cargoWeight),
      status: "DRAFT",
    };

    // Add optional route & scheduling fields
    if (origin) tripData.origin = origin.trim();
    if (destination) tripData.destination = destination.trim();
    if (scheduledDate) tripData.scheduledDate = new Date(scheduledDate);
    if (estimatedDistance) tripData.estimatedDistance = Number(estimatedDistance);
    if (estimatedFuelCost) tripData.estimatedFuelCost = Number(estimatedFuelCost);
    if (notes) tripData.notes = notes.trim();

    const trip = await Trip.create(tripData);

    // Populate for response
    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    res.status(201).json(populatedTrip);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate("vehicle driver").sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getActiveTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ status: "DISPATCHED" })
      .populate("vehicle driver")
      .sort({ actualDepartureTime: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getScheduledTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      status: "DRAFT",
      scheduledDate: { $exists: true, $ne: null },
    })
      .populate("vehicle driver")
      .sort({ scheduledDate: 1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle driver");
    if (!trip) return res.status(404).json({ msg: "Trip not found" });
    if (trip.status !== "DRAFT") {
      return res.status(400).json({ msg: "Only DRAFT trips can be dispatched" });
    }

    // Mark vehicle and driver as ON_TRIP when dispatching
    if (trip.vehicle) {
      if (trip.vehicle.status !== "AVAILABLE") {
        return res.status(400).json({ msg: `Vehicle is currently ${trip.vehicle.status} and cannot be dispatched` });
      }
      trip.vehicle.status = "ON_TRIP";
      await trip.vehicle.save();
    }
    if (trip.driver) {
      if (trip.driver.status !== "AVAILABLE") {
        return res.status(400).json({ msg: `Driver is currently ${trip.driver.status} and cannot be dispatched` });
      }
      // Check driver license expiry before allowing dispatch (documented in Section 7B)
      if (trip.driver.licenseExpiry && new Date(trip.driver.licenseExpiry) < new Date()) {
        return res.status(400).json({ msg: `Driver ${trip.driver.name}'s license has expired (${new Date(trip.driver.licenseExpiry).toLocaleDateString()}). Cannot dispatch.` });
      }
      trip.driver.status = "ON_TRIP";
      await trip.driver.save();
    }

    trip.status = "DISPATCHED";
    trip.actualDepartureTime = new Date();
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const { distance, fuelUsed } = req.body;
    const trip = await Trip.findById(req.params.id).populate("vehicle driver");
    if (!trip) return res.status(404).json({ msg: "Trip not found" });
    if (trip.status === "COMPLETED") {
      return res.status(400).json({ msg: "Trip is already completed" });
    }
    if (trip.status === "CANCELLED") {
      return res.status(400).json({ msg: "Cannot complete a cancelled trip" });
    }

    trip.status = "COMPLETED";
    trip.actualArrivalTime = new Date();
    if (distance !== undefined) trip.distance = Number(distance);
    if (fuelUsed !== undefined) trip.fuelUsed = Number(fuelUsed);
    
    // Auto-calculate revenue: ₹25 per kg
    trip.revenue = trip.cargoWeight * 25;
    
    await trip.save();

    if (trip.vehicle) {
      trip.vehicle.status = "AVAILABLE";
      if (distance) trip.vehicle.odometer += Number(distance);
      await trip.vehicle.save();
    }

    if (trip.driver) {
      trip.driver.status = "AVAILABLE";
      // Update driver performance stats
      trip.driver.totalTrips = (trip.driver.totalTrips || 0) + 1;
      trip.driver.totalDistance = (trip.driver.totalDistance || 0) + (Number(distance) || 0);
      trip.driver.totalRevenue = (trip.driver.totalRevenue || 0) + trip.revenue;
      await trip.driver.save();
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle driver");
    if (!trip) return res.status(404).json({ msg: "Trip not found" });
    if (trip.status === "COMPLETED") {
      return res.status(400).json({ msg: "Cannot cancel a completed trip" });
    }
    if (trip.status === "CANCELLED") {
      return res.status(400).json({ msg: "Trip is already cancelled" });
    }

    trip.status = "CANCELLED";
    await trip.save();

    // Only release resources if they were assigned (DISPATCHED or ON_TRIP)
    if (trip.vehicle && trip.vehicle.status === "ON_TRIP") {
      trip.vehicle.status = "AVAILABLE";
      await trip.vehicle.save();
    }
    if (trip.driver && trip.driver.status === "ON_TRIP") {
      trip.driver.status = "AVAILABLE";
      await trip.driver.save();
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

// Get trips assigned to a specific driver (for Driver role portal)
exports.getDriverTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.params.driverId })
      .populate("vehicle driver")
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};