// server/controllers/driverController.js
const Driver = require("../models/Driver");

// Helper for defensive role checks
const hasRole = (req, ...roles) => req.user && roles.includes(req.user.role);

exports.addDriver = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateDriverStatus = async (req, res) => {
  if (!hasRole(req, "Manager", "Dispatcher")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(driver);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteDriver = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });
    if (driver.status === "ON_TRIP") return res.status(400).json({ msg: "Cannot delete driver on an active trip" });
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ msg: "Driver deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};