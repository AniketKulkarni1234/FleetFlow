// server/controllers/incidentController.js
const Incident = require("../models/Incident");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

exports.reportIncident = async (req, res) => {
  try {
    const { type, vehicle, driver, severity, description, location, date } = req.body;

    // Validate required fields
    if (!type || !vehicle || !driver || !description) {
      return res.status(400).json({ msg: "Type, vehicle, driver, and description are required" });
    }

    // Validate type enum
    const validTypes = ["Accident", "Overspeed", "Vehicle Breakdown", "Driver Fatigue", "Mechanical Failure"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: `Invalid event type. Must be one of: ${validTypes.join(", ")}` });
    }

    // Validate severity enum
    const validSeverities = ["Low", "Medium", "High", "Critical"];
    if (severity && !validSeverities.includes(severity)) {
      return res.status(400).json({ msg: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` });
    }

    // Verify Vehicle exists
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }

    // Verify Driver exists
    const driverExists = await Driver.findById(driver);
    if (!driverExists) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    const incident = await Incident.create({
      type,
      vehicle,
      driver,
      severity: severity || "Medium",
      description: description.trim(),
      location: location ? location.trim() : "",
      date: date ? new Date(date) : new Date(),
    });

    const populated = await Incident.findById(incident._id).populate("vehicle driver");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Error reporting incident:", err);
    res.status(500).json({ msg: "Server error. Failed to report incident." });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().populate("vehicle driver").sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["REPORTED", "UNDER_INVESTIGATION", "INVESTIGATING", "RESOLVED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ msg: "Incident not found" });
    }

    incident.status = status;
    await incident.save();

    const populated = await Incident.findById(incident._id).populate("vehicle driver");
    res.json(populated);
  } catch (err) {
    console.error("Error updating incident status:", err);
    res.status(500).json({ msg: "Server error. Failed to update status." });
  }
};
