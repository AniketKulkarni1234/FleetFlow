// server/controllers/vehicleController.js
const vehicleService = require("../services/vehicleService");

exports.addVehicle = async (req, res) => {
  try {
    const { name, licensePlate, maxCapacity, acquisitionCost } = req.body;

    if (!name || !licensePlate || !maxCapacity) {
      return res.status(400).json({ msg: "Name, license plate, and max capacity are required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ msg: "Vehicle name must be at least 2 characters" });
    }
    if (Number(maxCapacity) <= 0) {
      return res.status(400).json({ msg: "Max capacity must be greater than 0" });
    }

    const vehicle = await vehicleService.addVehicle({ name, licensePlate, maxCapacity, acquisitionCost });
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A vehicle with this license plate already exists" });
    }
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { name, licensePlate, maxCapacity, acquisitionCost } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name.trim();
    if (licensePlate) updateFields.licensePlate = licensePlate.trim().toUpperCase();
    if (maxCapacity !== undefined) {
      if (Number(maxCapacity) <= 0) {
        return res.status(400).json({ msg: "Max capacity must be greater than 0" });
      }
      updateFields.maxCapacity = Number(maxCapacity);
    }
    if (acquisitionCost !== undefined) {
      updateFields.acquisitionCost = Number(acquisitionCost);
    }

    const vehicle = await vehicleService.updateVehicle(req.params.id, updateFields);
    res.json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A vehicle with this license plate already exists" });
    }
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, status);
    res.json(vehicle);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server error. Please try again." });
  }
};