// server/models/Incident.js
const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  type: { type: String, enum: ["Accident", "Overspeed", "Vehicle Breakdown", "Driver Fatigue", "Mechanical Failure"], required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  description: { type: String, required: true },
  location: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["REPORTED", "UNDER_INVESTIGATION", "INVESTIGATING", "RESOLVED"], default: "REPORTED" },
}, { timestamps: true });

module.exports = mongoose.model("Incident", incidentSchema);
