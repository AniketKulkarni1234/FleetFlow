// server/controllers/tripController.js
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const hasRole = (req, ...roles) => req.user && roles.includes(req.user.role);

exports.createTrip = async (req, res) => {
  if (!hasRole(req, "Manager", "Dispatcher")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  const { vehicleId, driverId, cargoWeight } = req.body;
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });
    if (cargoWeight > vehicle.maxCapacity)
      return res.status(400).json({ msg: "Cargo exceeds max capacity" });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    const trip = await Trip.create({ vehicle: vehicleId, driver: driverId, cargoWeight, status: "DRAFT" });

    vehicle.status = "ON_TRIP";
    await vehicle.save();
    driver.status = "ON_TRIP";
    await driver.save();

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate("vehicle driver");
    res.json(trips);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.completeTrip = async (req, res) => {
  if (!hasRole(req, "Manager", "Dispatcher")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle driver");
    if (!trip) return res.status(404).json({ msg: "Trip not found" });
    trip.status = "COMPLETED";
    await trip.save();

    if (trip.vehicle) {
      trip.vehicle.status = "AVAILABLE";
      await trip.vehicle.save();
    }

    if (trip.driver) {
      trip.driver.status = "AVAILABLE";
      await trip.driver.save();
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.cancelTrip = async (req, res) => {
  if (!hasRole(req, "Manager", "Dispatcher")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const trip = await Trip.findById(req.params.id).populate("vehicle driver");
    if (!trip) return res.status(404).json({ msg: "Trip not found" });
    if (trip.status === "COMPLETED") return res.status(400).json({ msg: "Cannot cancel a completed trip" });

    trip.status = "CANCELLED";
    await trip.save();

    if (trip.vehicle) {
      trip.vehicle.status = "AVAILABLE";
      await trip.vehicle.save();
    }
    if (trip.driver) {
      trip.driver.status = "AVAILABLE";
      await trip.driver.save();
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};