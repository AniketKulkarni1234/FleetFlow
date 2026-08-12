// server/controllers/driverController.js
const Driver = require("../models/Driver");

exports.addDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseExpiry } = req.body;

    // Input validation
    if (!name || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({ msg: "Name, license number, and license expiry are required" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ msg: "Driver name must be at least 2 characters" });
    }
    const expiryDate = new Date(licenseExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      return res.status(400).json({ msg: "License expiry date cannot be in the past" });
    }

    // Check for duplicate license number
    const existing = await Driver.findOne({ licenseNumber: licenseNumber.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ msg: "A driver with this license number already exists" });
    }

    const driver = await Driver.create({
      name: name.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry: new Date(licenseExpiry),
    });
    res.status(201).json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A driver with this license number already exists" });
    }
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseExpiry } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name.trim();
    if (licenseNumber) updateFields.licenseNumber = licenseNumber.trim().toUpperCase();
    if (licenseExpiry) {
      updateFields.licenseExpiry = new Date(licenseExpiry);
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ msg: "Driver not found" });
    res.json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A driver with this license number already exists" });
    }
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["AVAILABLE", "ON_TRIP", "SUSPENDED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ msg: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });
    if (driver.status === "ON_TRIP") {
      return res.status(400).json({ msg: "Cannot delete driver on an active trip" });
    }
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ msg: "Driver deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};