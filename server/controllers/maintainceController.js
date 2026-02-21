// server/controllers/maintenanceController.js
const Maintenance = require("../models/Maintence");
const Vehicle = require("../models/Vehicle");

const hasRole = (req, ...roles) => req.user && roles.includes(req.user.role);

exports.logMaintenance = async (req, res) => {
  if (!hasRole(req, "Manager", "SafetyOfficer")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  const { vehicleId, description } = req.body;
  try {
    const maintenance = await Maintenance.create({ vehicle: vehicleId, description });
    const vehicle = await Vehicle.findById(vehicleId);
    vehicle.status = "IN_SHOP";
    await vehicle.save();
    res.status(201).json(maintenance);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    const logs = await Maintenance.find().populate("vehicle");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ msg: "Maintenance log not found" });
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ msg: "Maintenance log deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};