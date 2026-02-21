// server/controllers/vehicleController.js
const Vehicle = require("../models/Vehicle");

// Helper to check role on server side (defensive)
const hasRole = (req, ...roles) => {
  return req.user && roles.includes(req.user.role);
};

exports.addVehicle = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateVehicleStatus = async (req, res) => {
  if (!hasRole(req, "Manager", "Dispatcher")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });
    if (vehicle.status === "ON_TRIP") return res.status(400).json({ msg: "Cannot delete vehicle on an active trip" });
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ msg: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};