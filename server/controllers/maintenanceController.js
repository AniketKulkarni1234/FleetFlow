// server/controllers/maintenanceController.js
const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");

exports.logMaintenance = async (req, res) => {
  const { vehicleId, description } = req.body;
  try {
    // Input validation
    if (!vehicleId || !description) {
      return res.status(400).json({ msg: "Vehicle and description are required" });
    }
    if (description.trim().length < 3) {
      return res.status(400).json({ msg: "Description must be at least 3 characters" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }

    const maintenance = await Maintenance.create({
      vehicle: vehicleId,
      description: description.trim(),
      status: "PENDING",
    });

    vehicle.status = "IN_SHOP";
    await vehicle.save();

    const populated = await Maintenance.findById(maintenance._id).populate("vehicle");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    const logs = await Maintenance.find().populate("vehicle").sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.resolveMaintenance = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id).populate("vehicle");
    if (!log) return res.status(404).json({ msg: "Maintenance log not found" });
    if (log.status === "RESOLVED") {
      return res.status(400).json({ msg: "Maintenance log is already resolved" });
    }

    log.status = "RESOLVED";
    log.resolvedAt = new Date();
    await log.save();

    // Set vehicle back to AVAILABLE if it's still IN_SHOP
    if (log.vehicle && log.vehicle.status === "IN_SHOP") {
      log.vehicle.status = "AVAILABLE";
      await log.vehicle.save();
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ msg: "Maintenance log not found" });
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ msg: "Maintenance log deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};
